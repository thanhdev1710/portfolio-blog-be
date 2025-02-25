import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CatchAsync from "../../utils/error/CatchAsync";
import { db, pool } from "../../db/db";
import AppError from "../../utils/error/AppError";
import { NextFunction, Request, Response } from "express";
import { Table, Column, and, gt } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import { PgColumn } from "drizzle-orm/pg-core";
import sendEmail from "../../utils/email";
import { renderFile } from "ejs";
import path from "path";

interface TypeUser {
  id: number;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "author" | "editor" | "subscriber" | null;
}

const createUserSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(20)
      .regex(
        /^[a-zA-Z0-9]*$/,
        "Name must not contain spaces or special characters"
      ),
    email: z.string().email(),
    password: z
      .string()
      .min(16)
      .max(50)
      .refine(
        (password) =>
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[!@#$%^&*(),.?":{}|<>]/.test(password),
        {
          message:
            "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        }
      ),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords must match.",
  });

const resetPasswordUserSchema = z
  .object({
    password: z
      .string()
      .min(16)
      .max(50)
      .refine(
        (password) =>
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[!@#$%^&*(),.?":{}|<>]/.test(password),
        {
          message:
            "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        }
      ),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords must match.",
  });

const updatePasswordUserSchema = z
  .object({
    password: z
      .string()
      .min(16)
      .max(50)
      .refine(
        (password) =>
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[!@#$%^&*(),.?":{}|<>]/.test(password),
        {
          message:
            "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        }
      ),
    passwordConfirm: z.string(),
    passwordCurrent: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords must match.",
  });

export const validationCreateUser = CatchAsync(async (req, res, next) => {
  createUserSchema.parse(req.body);

  next();
});

export const validationResetPasswordUser = CatchAsync(
  async (req, res, next) => {
    resetPasswordUserSchema.parse(req.body);

    next();
  }
);

export const validationUpdatePasswordUser = CatchAsync(
  async (req, res, next) => {
    updatePasswordUserSchema.parse(req.body);

    next();
  }
);

const signJWT = (user: TypeUser) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      "JWT_SECRET is not defined in environment variables.",
      500
    );
  }

  try {
    return jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
  } catch (error) {
    throw new AppError("Failed to sign JWT.", 500);
  }
};

const changedPasswordAfter = (
  passwordChangedAt?: Date | null,
  JWTTimestamp?: number | null
) => {
  if (!passwordChangedAt || !JWTTimestamp) return false;
  else {
    const changedTimestamp = parseInt(
      `${passwordChangedAt.getTime() / 1000}`,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
};

const verifyJWT = (
  token: string
): Promise<jwt.JwtPayload | string | undefined> => {
  return new Promise((res, rej) => {
    jwt.verify(token, process.env.JWT_SECRET || "", (err, decoded) => {
      if (err) {
        rej(err);
      } else res(decoded);
    });
  });
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createSignToken(user: TypeUser, statusCode: number, res: Response) {
  const token = signJWT(user);

  res.cookie("jwt", token, {
    maxAge: Number(process.env.COOKIE_MAX_AGE),
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    priority: "high",
  });

  res.status(statusCode).json({
    status: "success",
    token,
  });
}

export const signup = CatchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const sql = `
        INSERT INTO users (name,email,password)
        VALUES ($1,$2,$3)
        RETURNING id
  `;

  const hashPass = await bcrypt.hashSync(password, 12);

  const result = await pool.query(sql, [name, email, hashPass]);

  createSignToken(result.rows[0].id, 200, res);
});

export const login = CatchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const rs = (
    await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        password: users.password,
        image: users.image,
      })
      .from(users)
      .where(eq(email, users.email))
  )[0];

  const sql = `
    SELECT id, password
    FROM users
    WHERE email = $1
  `;

  const result = await pool.query(sql, [email]);

  if (result.rowCount === 0) {
    return next(new AppError("Invalid email.", 401));
  } else {
    const { email, id, name, password: userPassword, role, image } = rs;
    const isCorrect = await bcrypt.compare(password, userPassword);

    if (isCorrect) {
      createSignToken({ email, id, name, role, image }, 200, res);
    } else {
      return next(new AppError("Invalid Password.", 401));
    }
  }
});

export const protect = CatchAsync(async (req, res, next) => {
  const { authorization } = req.headers;
  let token;

  if (authorization && authorization.startsWith("Bearer")) {
    token = authorization.split(" ")[1];
  }

  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );

  const decode = await verifyJWT(token);

  if (!decode || typeof decode === "string") {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const sql = `
    SELECT * FROM users
    WHERE id = $1
    `;

  const result = await pool.query(sql, [decode.id]);
  const userExisting = result.rows[0];

  if (!userExisting)
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );

  const isCheckChangedPass = changedPasswordAfter(
    userExisting.password_changed_at,
    decode.iat
  );

  if (isCheckChangedPass) {
    return next(
      new AppError("User recently changed password! Please log in again", 401)
    );
  }
  (req as any).user = userExisting;
  next();
});

export const restrictTo = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

// Chỉ dùng cho các route có id param
export const restrictToOwnerOrRoles = (
  roles: string[], // Vai trò được phép
  table: Table, // Bảng cơ sở dữ liệu
  idColumn: Column, // Cột chứa ID của đối tượng (bài viết hoặc người dùng)
  ownerColumn: PgColumn<any> // Cột chứa ID chủ sở hữu
) => {
  return CatchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // ID của đối tượng (bài viết hoặc người dùng)
    const user = (req as any).user; // Người dùng từ middleware protect

    // 1. Kiểm tra vai trò
    if (roles.includes(user.role)) {
      return next(); // Vai trò hợp lệ, tiếp tục
    }

    // 2. Truy vấn đối tượng từ cơ sở dữ liệu
    const result = (
      await db
        .select({ ownerId: ownerColumn }) // Chỉ truy vấn cột chủ sở hữu
        .from(table) // Truy vấn từ bảng chỉ định
        .where(eq(idColumn, Number(id)))
    )[0]; // Điều kiện khớp ID

    // 3. Kiểm tra đối tượng tồn tại
    if (!result) {
      return next(new AppError("Resource not found", 404));
    }

    // 4. Kiểm tra quyền sở hữu
    if (result.ownerId === user.id) {
      return next(); // Người dùng là chủ sở hữu, tiếp tục
    }

    // 5. Không có quyền
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  });
};

export const forgotPassword = CatchAsync(async (req, res, next) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, req.body.email),
  });

  if (!user)
    return next(new AppError("There is no user with this email address", 404));

  const resetToken = randomBytes(32).toString("hex");

  const hashTokenStr = hashToken(resetToken);

  await db
    .update(users)
    .set({
      passwordResetToken: hashTokenStr,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .where(eq(users.id, user.id));

  const resetURL = `${process.env.ORIGIN}/forgot/${resetToken}`;

  const templatePath = path.join(__dirname, "../../views/EmailForgotPass.ejs");

  // 5) Tạo thông điệp cho email
  const html = await renderFile(
    templatePath,
    {
      resetURL,
    },
    { async: true }
  );

  try {
    await sendEmail({
      to: user.email,
      subject: "Your password reset token (valid for 10 min)",
      html,
    });

    return res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch {
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, user.id));
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

export const resetPassword = CatchAsync(async (req, res, next) => {
  const hashedToken = createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const userQuery = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, hashedToken),
        gt(users.passwordResetExpires, new Date().toISOString())
      )
    )
    .limit(1);

  const user = userQuery[0];

  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  const hashPass = await bcrypt.hashSync(req.body.password, 12);

  const userUpdateQuery = await db
    .update(users)
    .set({
      password: hashPass,
      passwordChangedAt: new Date(Date.now() - 1000).toISOString(),
      passwordResetExpires: null,
      passwordResetToken: null,
    })
    .where(eq(users.id, user.id))
    .returning();

  const { email, id, image, name, role } = userUpdateQuery[0];

  const token = signJWT({ email, id, image, name, role });

  res.status(200).json({
    status: "success",
    token,
  });
});

export const updatePassword = CatchAsync(async (req, res, next) => {
  const { passwordCurrent, password } = req.body;

  const user = (
    await db
      .select()
      .from(users)
      .where(eq(users.id, (req as any).user.id))
  )[0];

  const isCorrect = await bcrypt.compare(passwordCurrent, user.password);

  if (!isCorrect)
    return next(new AppError("Your current password is wrong", 401));

  const hashPass = await bcrypt.hash(password, 12);

  const { email, id, image, name, role } = (
    await db
      .update(users)
      .set({
        password: hashPass,
        passwordChangedAt: new Date(Date.now() - 1000).toISOString(),
      })
      .where(eq(users.id, (req as any).user.id))
      .returning()
  )[0];

  createSignToken({ email, id, image, name, role }, 200, res);
});
