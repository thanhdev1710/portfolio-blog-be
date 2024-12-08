import express, { Application, NextFunction, Request, Response } from "express";
import routerPosts from "./routes/posts/posts.route";
import routerPostSections from "./routes/posts/post_sections.route";
import routerUsers from "./routes/users/users.route";
import routerEmail from "./routes/email/email.route";
import morgan from "morgan";
import cors from "cors";
import GlobalError from "./controllers/error/GlobalError";
import AppError from "./utils/error/AppError";
import cookieParser from "cookie-parser";

// Cấu hình CORS: Cho phép các nguồn cụ thể (Vercel và localhost)
const corsOptions = {
  origin: [process.env.ORIGIN!, "http://localhost:3000"],
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

const app: Application = express();
const URL_API = "/api/v1";

// Sử dụng morgan để log các HTTP requests trong môi trường phát triển
app.use(morgan("dev"));

// Cấu hình CORS
app.use(cors(corsOptions));

// Phân tích JSON từ request body
app.use(cookieParser());
app.use(express.json());

// Routes: Định nghĩa các route cho posts
app.use(`${URL_API}/email`, routerEmail);
app.use(`${URL_API}/posts`, routerPosts);
app.use(`${URL_API}/posts/:id/sections`, routerPostSections);
app.use(`${URL_API}/users`, routerUsers);

// Route catch-all: Trả lỗi nếu URL không tồn tại
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Middleware xử lý lỗi toàn cầu
app.use(GlobalError);

export default app;
