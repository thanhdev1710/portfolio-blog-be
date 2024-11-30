import fs from "fs";
import path from "path";
import sendEmail from "../../utils/email";
import AppError from "../../utils/error/AppError";
import CatchAsync from "../../utils/error/CatchAsync";

export const subscribe = CatchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Kiểm tra email có hợp lệ không
  if (!email) return next(new AppError("Email is required", 400)); // HTTP 400: Bad Request

  const htmlPath = path.join(__dirname, "email.template.html");

  // Kiểm tra file email template có tồn tại không
  if (!fs.existsSync(htmlPath)) {
    return next(new AppError("Email template not found", 500)); // HTTP 500: Internal Server Error
  }

  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  const ListPost = `
          <div class="post">
        <img src="%URL%/_next/image?url=%2Fimages%2Fimg3.webp&w=750&q=75" alt="Post Image" />
        <div class="content">
          <h4>
            <a href="%URL%/blog/post-1"
              >How to Master Fullstack Development in 2024</a
            >
          </h4>
          <p>
            Learn the key principles and tools for becoming a fullstack
            developer in the modern web development ecosystem.
          </p>
          <a href="%URL%/blog/post-1">Read More</a>
        </div>
      </div>
      <div class="post">
        <img src="%URL%/_next/image?url=%2Fimages%2Fimg3.webp&w=750&q=75" alt="Post Image" />
        <div class="content">
          <h4>
            <a href="%URL%/blog/post-2"
              >Best Practices for Designing Scalable APIs</a
            >
          </h4>
          <p>
            Discover the best techniques for designing APIs that can scale
            effectively, ensuring reliability and performance.
          </p>
          <a href="%URL%/blog/post-2">Read More</a>
        </div>
      </div>
      <div class="post">
        <img src="%URL%/_next/image?url=%2Fimages%2Fimg3.webp&w=750&q=75" alt="Post Image" />
        <div class="content">
          <h4>
            <a href="%URL%/blog/post-3"
              >Exploring the Power of PostgreSQL in Modern Apps</a
            >
          </h4>
          <p>
            Dive into PostgreSQL's powerful features and how it can enhance the
            performance and scalability of your applications.
          </p>
          <a href="%URL%/blog/post-3">Read More</a>
        </div>
      </div>
      <div class="post">
        <img src="%URL%/_next/image?url=%2Fimages%2Fimg3.webp&w=750&q=75" alt="Post Image" />
        <div class="content">
          <h4>
            <a href="%URL%/blog/post-4"
              >Building Real-Time Features with Redis and Socket.IO</a
            >
          </h4>
          <p>
            Learn how to use Redis and Socket.IO to build real-time features
            such as chat, notifications, and live updates.
          </p>
          <a href="%URL%/blog/post-4">Read More</a>
        </div>
      </div>
      <div class="post">
        <img src="%URL%/_next/image?url=%2Fimages%2Fimg3.webp&w=750&q=75" alt="Post Image" />
        <div class="content">
          <h4>
            <a href="%URL%/blog/post-5"
              >Why Elasticsearch is a Game-Changer for Developers</a
            >
          </h4>
          <p>
            Understand how Elasticsearch can revolutionize search and analytics
            in your application, handling large datasets efficiently.
          </p>
          <a href="%URL%/blog/post-5">Read More</a>
        </div>
      </div>
  `;

  const subject = "Welcome to the Blog! Stay Updated with the Latest Posts";
  const html = htmlContent
    .replace(/%LISTPOST%/g, ListPost)
    .replace(/%URL%/g, "https://thanhdev.vercel.app/");

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
