import express, { Application, NextFunction, Request, Response } from "express";
import routerPosts from "./routes/posts/posts.route";
import routerUsers from "./routes/users/users.route";
import routerEmail from "./routes/email/email.route";
import routerHashtags from "./routes/hashtags/hashtags.route";
import routerCategories from "./routes/categories/categories.route";
import routerLike from "./routes/likes/like.route";
import routerBookmark from "./routes/bookmarks/bookmark.route";
import routerComment from "./routes/comments/comment.route";
import cors, { CorsOptions } from "cors";
import GlobalError from "./controllers/error/GlobalError";
import AppError from "./utils/error/AppError";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import xss, { IFilterXSSOptions } from "xss";
import logger from "./utils/logger";

// Cấu hình CORS: Cho phép các nguồn cụ thể (Vercel và localhost)
const corsOptions: CorsOptions = {
  origin: [process.env.ORIGIN!, "http://localhost:3000"], // Định nghĩa các nguồn gốc được phép
  methods: "GET,POST,PUT,PATCH,DELETE", // Các phương thức HTTP được phép
  allowedHeaders: "Content-Type,Authorization", // Các header được phép
  credentials: true, // Cho phép cookies đi kèm với các yêu cầu CORS
  preflightContinue: false, // Không tiếp tục gửi yêu cầu OPTIONS sau khi preflight
  optionsSuccessStatus: 204, // Mã trạng thái trả về cho preflight request thành công
};

const limiter = rateLimit({
  limit: 100, // Giới hạn số lượng yêu cầu
  windowMs: 15 * 60 * 1000, // Thời gian giới hạn trong 15 phút
  message: "Too many requests form this IP, please try again in an hour!", // Thông báo khi vượt quá giới hạn
});

const xssOptions: IFilterXSSOptions = {
  whiteList: {}, // Loại bỏ tất cả các thẻ HTML
  stripIgnoreTag: true, // Loại bỏ thẻ mà thư viện không hiểu
};

const app: Application = express();
const URL_API = "/api/v1";

// Middleware helmet giúp bảo mật HTTP headers
app.use(helmet());

// Cấu hình CORS cho ứng dụng
app.use(cors(corsOptions));

// Sử dụng rate limiter cho các yêu cầu API
// app.use("/api", limiter);

// Middleware để phân tích cookies
app.use(cookieParser());

// Middleware để phân tích JSON trong request body
app.use(
  express.json({
    limit: "10kb", // Giới hạn kích thước payload
  })
);

app.set("view engine", "ejs");

// Hàm làm sạch dữ liệu đầu vào, tránh tấn công XSS
const cleanObject = (obj: any) => {
  if (typeof obj === "string") {
    return xss(obj, xssOptions);
  }
  if (obj && typeof obj === "object") {
    for (let key in obj) {
      obj[key] = cleanObject(obj[key]);
    }
  }
  return obj;
};

// Middleware để làm sạch dữ liệu đầu vào từ req.body, req.query, req.params
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  req.body = cleanObject(req.body); // Làm sạch dữ liệu trong req.body
  req.query = cleanObject(req.query); // Làm sạch dữ liệu trong req.query
  req.params = cleanObject(req.params); // Làm sạch dữ liệu trong req.params
  next(); // Chuyển quyền xử lý sang middleware tiếp theo
};

// Sử dụng middleware sanitizeInput để làm sạch dữ liệu đầu vào
app.use(sanitizeInput);

// Thêm thông tin thời gian yêu cầu vào mỗi request
app.use((req, res, next) => {
  (req as any).requestTime = new Date().toISOString(); // Gắn thời gian yêu cầu vào đối tượng request
  next(); // Tiếp tục xử lý các middleware tiếp theo
});

// Middleware để ghi lại các yêu cầu HTTP
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`); // Ghi lại thông tin yêu cầu vào log
  next();
});

// Routes: Định nghĩa các route cho các API
app.use(`${URL_API}/email`, routerEmail); // Định nghĩa route cho email
app.use(`${URL_API}/posts`, routerPosts); // Định nghĩa route cho posts
app.use(`${URL_API}/users`, routerUsers); // Định nghĩa route cho users
app.use(`${URL_API}/hashtags`, routerHashtags);
app.use(`${URL_API}/categories`, routerCategories);
app.use(`${URL_API}/like`, routerLike);
app.use(`${URL_API}/bookmark`, routerBookmark);
app.use(`${URL_API}/comments`, routerComment);

// Route catch-all: Trả lỗi nếu URL không tồn tại
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404)); // Trả lỗi 404 nếu route không tồn tại
});

// Middleware xử lý lỗi toàn cầu
app.use(GlobalError); // Chuyển tất cả lỗi đến middleware GlobalError để xử lý

export default app;
