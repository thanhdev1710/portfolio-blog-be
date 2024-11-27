import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CatchAsync from "../../utils/error/CatchAsync";
import { db, pool } from "../../db/db";
import AppError from "../../utils/error/AppError";
import { NextFunction, Request, Response } from "express";
import { Table, Column } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { posts } from "../../db/schema";
import { PgColumn } from "drizzle-orm/pg-core";

const createUserSchema = z
  .object({
    name: z.string().min(10).max(100),
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

export const validationCreateUser = CatchAsync(async (req, res, next) => {
  createUserSchema.parse(req.body);

  next();
});

const signJWT = (id: number) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      "JWT_SECRET is not defined in environment variables.",
      500
    );
  }

  try {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
  } catch (error) {
    throw new AppError("Failed to sign JWT.", 500);
  }
};

const changedPasswordAfter = (
  passwordChangedAt?: number | null,
  JWTTimestamp?: number | null
) => {
  if (!passwordChangedAt || !JWTTimestamp) return false;
  else {
    console.log(passwordChangedAt);
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

export const signup = CatchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const sql = `
        INSERT INTO users (name,email,password)
        VALUES ($1,$2,$3)
        RETURNING id
  `;

  const hashPass = await bcrypt.hashSync(password, 12);

  const result = await pool.query(sql, [name, email, hashPass]);

  const token = signJWT(result.rows[0].id);

  res.status(200).json({
    status: "success",
    token,
  });
});

export const login = CatchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const sql = `
    SELECT id, password
    FROM users
    WHERE email = $1
  `;

  const result = await pool.query(sql, [email]);

  if (result.rowCount === 0) {
    return next(new AppError("Invalid email.", 401));
  } else {
    const { id: userId, password: userPassword } = result.rows[0];
    const isCorrect = await bcrypt.compareSync(password, userPassword);

    if (isCorrect) {
      const token = signJWT(userId);
      return res.status(200).json({
        status: "success",
        token,
      });
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
