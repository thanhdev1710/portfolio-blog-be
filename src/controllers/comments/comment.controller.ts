import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../db/db";
import { comments, users } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";
import { z } from "zod";
import AppError from "../../utils/error/AppError";

const validateComment = z.object({
  body: z.string(),
  postId: z.number(),
  parentId: z.number().optional(),
});

const validateCommentUpdate = z.object({
  body: z.string(),
});

export const ValidateCommentUpdate = CatchAsync(async (req, res, next) => {
  validateCommentUpdate.parse(req.body);

  next();
});

export const ValidateComment = CatchAsync(async (req, res, next) => {
  validateComment.parse(req.body);

  next();
});

export const createComment = CatchAsync(async (req, res, next) => {
  const { postId, parentId, body } = req.body;
  const userId = (req as any).user.id;

  await db
    .insert(comments)
    .values({ body, postId, userId, parentId: parentId || null });

  res.status(200).json({
    status: "success",
    message: "Bình luận bài viết thành công.",
  });
});

export const deleteComment = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  await db.delete(comments).where(eq(comments.id, Number(id)));

  res.status(200).json({
    status: "success",
    message: "Xoá bình luận bài viết thành công.",
  });
});

export const updateComment = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req.body;

  await db
    .update(comments)
    .set({ body, updatedAt: new Date().toISOString() })
    .where(eq(comments.id, Number(id)));

  res.status(200).json({
    status: "success",
    message: "Cập nhật bình luận bài viết thành công.",
  });
});

export const getCommentByPostId = CatchAsync(async (req, res, next) => {
  const { postId } = req.params;

  if (!postId) {
    throw new AppError("Post id required!", 400);
  }

  const listComment = await db
    .select({
      ...getTableColumns(comments),
      user_name: users.name,
      user_img: users.image,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.postId, Number(postId)));

  res.status(200).json({
    status: "success",
    data: listComment,
  });
});
