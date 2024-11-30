import { z } from "zod";
import CatchAsync from "../../utils/error/CatchAsync";
import { db, pool } from "../../db/db";
import AppError from "../../utils/error/AppError";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";

const updateUserSchema = z
  .object({
    name: z.string().min(10).max(100).optional().nullable(),
    image: z.string().optional().nullable(),
  })
  .refine(
    (data) => !(data.name == null && data.image == null), // Không cho phép cả hai đều rỗng
    {
      message: "At least one of 'name' or 'image' must be provided.",
    }
  );

const updateRoleSchema = z.object({
  id: z.number(),
  role: z.enum(["admin", "author", "editor", "subscriber"]),
});

export const validationUpdateUser = CatchAsync(async (req, res, next) => {
  updateUserSchema.parse(req.body);

  next();
});

export const validationUpdateRole = CatchAsync(async (req, res, next) => {
  updateRoleSchema.parse(req.body);

  next();
});

export const updateUser = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, image } = req.body;

  // Prepare the update values
  const updates: Record<string, any> = {};

  if (name) {
    updates.name = name;
  }

  if (image) {
    updates.image = image;
  }

  // If no fields to update, return an error
  if (Object.keys(updates).length === 0) {
    return next(new AppError("No fields to update.", 400));
  }

  // Update the user in the database
  const updatedUser = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, Number(id)))
    .returning(); // Retrieve the updated user

  if (updatedUser.length === 0) {
    return next(new AppError("User not found.", 404)); // Handle user not found
  }

  res.status(200).json(updatedUser[0]); // Respond with the updated user data
});

export const deleteUser = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  const result = await db.delete(users).where(eq(users.id, Number(id)));

  if (result.rowCount === 0) return next(new AppError("User not found.", 404));

  res.status(204).send();
});

export const updateRole = CatchAsync(async (req, res, next) => {
  const { role, id } = req.body;
  const user = (await db.select().from(users).where(eq(users.id, id)))[0];

  if (!user) return next(new AppError("", 404));

  const userUpdate = (
    await db
      .update(users)
      .set({ role })
      .where(eq(users.id, user.id))
      .returning()
  )[0];

  res.json({ role, user: userUpdate });
});
