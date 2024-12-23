import { z } from "zod";
import { db } from "../../db/db";
import { comments, likes, posts } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";
import AppError from "../../utils/error/AppError";
import { and, eq } from "drizzle-orm";

// Xác thực dữ liệu
const likePostValidate = z
  .object({
    status: z.enum(["like", "dislike"]),
    postId: z.number().optional(),
    commentId: z.number().optional(),
  })
  .refine((data) => data.postId || data.commentId, {
    message: "Either postId or commentId must be provided.",
    path: ["postId", "commentId"],
  });

// Kiểm tra xác thực
export const validateLikePost = CatchAsync(async (req, res, next) => {
  likePostValidate.parse(req.body);
  next();
});

// Xử lý like/unlike
const handleLike = async (
  userId: number,
  status: string,
  id: number,
  isPost: boolean
) => {
  const table = isPost ? posts : comments;
  const idField = isPost ? "postId" : "commentId";

  // Kiểm tra sự tồn tại của bài viết hoặc bình luận
  const itemExists = await db.$count(table, eq(table.id, id));
  if (itemExists === 0) {
    throw new AppError(`${isPost ? "Post" : "Comment"} not found.`, 404);
  }

  // Kiểm tra nếu user đã like rồi
  const likeExisting = await db.$count(
    likes,
    and(eq(likes.userId, userId), eq(likes[idField], id))
  );

  const title = isPost ? "bài viết" : "bình luận";

  if (likeExisting > 0) {
    // Nếu đã like thì kiểm tra trạng thái và gỡ like nếu giống trạng thái cũ
    const currentLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes[idField], id)))
      .limit(1);

    if (currentLike[0].status === status) {
      await db.delete(likes).where(eq(likes.id, currentLike[0].id));
      return {
        message: `${
          status === "like" ? "Bỏ thích " + title : "Bỏ không thích " + title
        }.`,
      };
    } else {
      await db
        .update(likes)
        .set({ status })
        .where(eq(likes.id, currentLike[0].id));
      return {
        message: `${
          status === "like" ? "Thích " + title : "Không thích " + title
        }.`,
      };
    }
  } else {
    // Nếu chưa like thì thêm mới
    await db.insert(likes).values({
      userId,
      [idField]: id,
      status,
    });
    return {
      message: `${
        status === "like" ? "Thích " + title : "Không thích " + title
      }.`,
    };
  }
};

// Hàm xử lý chính
export const likePost = CatchAsync(async (req, res, next) => {
  const { status, postId, commentId } = req.body;
  const userId = (req as any).user.id;

  if (postId) {
    const result = await handleLike(userId, status, postId, true);
    return res.status(200).json({
      status: "success",
      message: result.message,
    });
  } else if (commentId) {
    const result = await handleLike(userId, status, commentId, false);
    return res.status(200).json({
      status: "success",
      message: result.message,
    });
  } else {
    next(new AppError("Either postId or commentId must be provided.", 400));
  }
});
