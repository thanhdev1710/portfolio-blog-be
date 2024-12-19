import { eq, sql } from "drizzle-orm";
import { db } from "../../db/db";
import { posts } from "../../db/schema";
import CatchAsync from "../../utils/error/CatchAsync";
import AppError from "../../utils/error/AppError";
import { parse } from "cookie";

export const recordView = CatchAsync(async (req, res, next) => {
  const { slug } = req.params;

  // Kiểm tra xem bài viết có tồn tại không
  const postExisting = await db.$count(posts, eq(posts.slug, slug));

  if (postExisting === 0) {
    return next(new AppError("Post not found.", 404));
  }

  // Lấy cookie từ headers
  const cookies = parse(req.headers.cookie || "");
  const viewedPosts = cookies.viewedPosts ? cookies.viewedPosts.split(",") : [];

  // Nếu bài viết đã được xem, không cập nhật lượt xem
  if (viewedPosts.includes(slug)) {
    return next(); // Không làm gì nếu đã xem
  }

  // Cập nhật lượt xem
  await db
    .update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(eq(posts.slug, slug));

  // Lưu bài viết đã xem vào cookies
  viewedPosts.push(slug);
  res.cookie("viewedPosts", viewedPosts.join(","), {
    maxAge: 86400000,
    httpOnly: true,
  });

  next();
});
