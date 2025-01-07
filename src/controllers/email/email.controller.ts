import { renderFile } from "ejs";
import sendEmail from "../../utils/email";
import AppError from "../../utils/error/AppError";
import CatchAsync from "../../utils/error/CatchAsync";
import path from "path";
import { db } from "../../db/db";
import { posts } from "../../db/schema";
import { desc, eq } from "drizzle-orm";

export const subscribe = CatchAsync(async (req, res, next) => {
  const { email } = req.body;
  const listPost = await db
    .select({
      slug: posts.slug,
      summary: posts.summary,
      image: posts.image,
      title: posts.title,
    })
    .from(posts)
    .where(eq(posts.status, "public"))
    .limit(5)
    .orderBy(desc(posts.views));

  // Kiểm tra email có hợp lệ không
  if (!email) return next(new AppError("Email is required", 400)); // HTTP 400: Bad Request

  const templatePath = path.join(__dirname, "../../views/EmailSubscribe.ejs");
  const html = await renderFile(templatePath, {
    url: process.env.ORIGIN,
    listPost,
  });

  const subject = "Welcome to the Blog! Stay Updated with the Latest Posts";

  try {
    // Gửi email
    await sendEmail({ to: email, subject, html });
    return res.status(200).json({
      status: "success",
      message: "Subscription successful! Please check your email.",
    });
  } catch (error) {
    return next(
      new AppError("Failed to send email. Please try again later.", 500)
    );
  }
});
