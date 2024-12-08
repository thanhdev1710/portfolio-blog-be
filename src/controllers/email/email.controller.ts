import sendEmail from "../../utils/email";
import AppError from "../../utils/error/AppError";
import CatchAsync from "../../utils/error/CatchAsync";

export const subscribe = CatchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Kiểm tra email có hợp lệ không
  if (!email) return next(new AppError("Email is required", 400)); // HTTP 400: Bad Request

  const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Template</title>
    <style>
      body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 0;
        color: #333;
      }

      header {
        text-align: center;
        padding: 25px;
        border-bottom: 2px solid #004a99;
      }

      header h1 {
        font-size: 2.2em;
        margin: 0;
        color: #004a99;
      }

      header h2 {
        font-size: 1.4em;
        margin: 10px 0;
        color: #333;
      }

      header p {
        font-size: 1em;
        line-height: 1.6;
        color: #555;
      }

      main {
        padding: 30px;
        margin: 0 auto;
        max-width: 700px;
        width: 90%;
      }

      .post {
        display: flex;
        flex-direction: row;
        margin-bottom: 25px;
        padding: 15px;
        border-bottom: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .post img {
        width: 120px;
        height: 90px;
        object-fit: cover;
        border-radius: 8px;
        margin-right: 20px;
      }

      .post .content {
        flex: 1;
      }

      .post h4 {
        font-size: 1.1em;
        margin: 0;
        color: #004a99;
      }

      .post p {
        font-size: 0.95em;
        line-height: 1.6;
        color: #555;
        margin-top: 8px;
        display: -webkit-box; /* Sử dụng box model cho đoạn văn */
        -webkit-line-clamp: 2; /* Giới hạn số dòng hiển thị là 2 */
        -webkit-box-orient: vertical; /* Xác định chiều hướng của box */
        overflow: hidden; /* Ẩn phần nội dung thừa */
      }

      .post a {
        font-weight: 600;
        text-decoration: none;
        display: inline-block;
        padding: 6px 12px;
        background-color: #004a99;
        color: white;
        border-radius: 5px;
        transition: background-color 0.3s;
      }

      .post a:hover {
        background-color: #003366;
      }

      footer {
        text-align: center;
        padding: 20px;
        margin-top: 30px;
        border-top: 2px solid #ddd;
        color: #333;
      }

      footer a {
        color: #004a99;
        text-decoration: none;
      }

      @media only screen and (max-width: 600px) {
        .post {
          flex-direction: column;
          align-items: center;
          padding: 15px;
        }

        .post img {
          margin-right: 0;
          margin-bottom: 15px;
        }

        header h1 {
          font-size: 2em;
        }

        header h2 {
          font-size: 1.3em;
        }

        .post h4 {
          font-size: 1em;
        }

        .post p {
          font-size: 0.9em;
        }

        .post a {
          font-size: 0.9em;
          padding: 10px 18px;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>ThanhDev</h1>
      <h2>Explore the Latest in Tech and Development!</h2>
      <p>
        Join me in discovering new technologies, trends, and tutorials that can
        help you excel in your programming journey.
      </p>
    </header>
    <main>%LISTPOST%</main>
    <footer>
      <p>&copy; 2024 ThanhDev. All rights reserved.</p>
      <p>Visit my personal portfolio at <a href="%URL%">%URL%</a>.</p>
    </footer>
  </body>
</html>
  `;

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
    .replace(/%URL%/g, "https://thanhdev.io.vn/");

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
