import { z } from "zod";
import CatchAsync from "../../utils/error/CatchAsync";
import { db } from "../../db/db";
import { bookmarks } from "../../db/schema";
import { and, eq } from "drizzle-orm";

const ValidateBookmark = z.object({
  postId: z.number(),
});

export const validateBookmark = CatchAsync(async (req, res, next) => {
  ValidateBookmark.parse(req.body);
  next();
});

export const handleBookmark = CatchAsync(async (req, res, next) => {
  const { postId } = req.body;
  const user = (req as any).user;

  const bookmarkExists = await db.$count(
    bookmarks,
    and(eq(bookmarks.postId, postId), eq(bookmarks.userId, user.id))
  );

  if (bookmarkExists > 0) {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, user.id)));

    return res.status(200).json({
      status: "success",
      message: "Bỏ lưu bài viết thành công.",
    });
  } else {
    await db.insert(bookmarks).values({
      postId,
      userId: user.id,
    });

    return res.status(200).json({
      status: "success",
      message: "Lưu bài viết thành công.",
    });
  }
});
