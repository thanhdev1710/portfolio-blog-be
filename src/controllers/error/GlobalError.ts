import { NextFunction, Request, Response } from "express";
import AppError from "../../utils/error/AppError";

// Hàm xử lý lỗi Zod (validation lỗi từ thư viện Zod)
const handleZodError = (err: AppError) => {
  // Lấy giá trị lỗi từ AppError (trong trường hợp lỗi Zod)
  let tmpErr = Object.values(err)[0].map((e: any) => ({
    message: e.message, // Lấy thông báo lỗi
    path: e.path[0], // Lấy đường dẫn (thường là tên trường bị lỗi)
  }));

  return new AppError("Validation failed for one or more fields", 400, tmpErr); // Trả về lỗi AppError với thông điệp và mã lỗi 400 (Bad Request)
};

const handleError23505 = (err: AppError) => {
  return new AppError(err.message, 400);
};

const handleError23502 = (err: AppError) => {
  return new AppError(err.message, 400);
};

const handleJsonWebTokenError = () => {
  return new AppError("Invalid token. Please log in again!", 401);
};
const handleTokenExpiredError = () => {
  return new AppError("Your token has expired! Please log in again", 401);
};

// Hàm xử lý lỗi trong môi trường production
const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    // Nếu lỗi là lỗi do người dùng (ví dụ: lỗi validation)
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
  } else {
    // Nếu lỗi là do hệ thống (ví dụ: lỗi server)
    console.error(`ERROR 💥:`, err); // Log chi tiết lỗi
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!", // Thông báo lỗi chung cho người dùng
    });
  }
};

// Hàm xử lý lỗi trong môi trường development
const sendErrorDev = (err: AppError, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err, // Log chi tiết lỗi
    message: err.message, // Thông báo lỗi
    stack: err.stack, // Log stack trace (dành cho developer)
  });
};

// Middleware xử lý lỗi toàn cục
export default function GlobalError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  err.statusCode = err.statusCode || 500; // Mặc định mã lỗi là 500 (server error) nếu không có mã lỗi
  err.status = err.status || "error"; // Mặc định trạng thái là "error" nếu không có

  // Kiểm tra môi trường để xác định cách xử lý lỗi
  if (process.env.NODE_ENV?.trim() === "dev") {
    // Nếu là môi trường development, gửi chi tiết lỗi cho client
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV?.trim() === "production") {
    // Nếu là môi trường production, kiểm tra lỗi là ZodError hay không và gửi thông báo lỗi phù hợp
    let error = { ...err, message: err.message };
    if (err.name === "ZodError") error = handleZodError(err); // Xử lý lỗi Zod nếu có
    if (err.code === "23505") error = handleError23505(err);
    if (err.code === "23502") error = handleError23502(err);
    if (err.name === "JsonWebTokenError") error = handleJsonWebTokenError();
    if (err.name === "TokenExpiredError") error = handleTokenExpiredError();

    sendErrorProd(error, res); // Gửi lỗi về client
  }
}
