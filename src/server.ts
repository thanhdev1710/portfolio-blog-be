import { configDotenv } from "dotenv";
configDotenv();

import { closePool } from "./db/db";
import logger from "./utils/logger"; // Import logger

// Lấy cổng từ biến môi trường hoặc mặc định là 8000
const port = process.env.PORT || 8000;

// Xử lý lỗi uncaughtException (lỗi chưa được bắt)
process.on("uncaughtException", (err: any) => {
  logger.error("uncaughtException! 💥 Shutting down..."); // Log lỗi khi không bắt được exception
  logger.error("Error Name: " + err.name);
  logger.error("Error Message: " + err.message);
  process.exit(1); // Dừng ứng dụng khi xảy ra lỗi nghiêm trọng
});

// Import ứng dụng express
import app from "./app";

// Khởi chạy server trên cổng đã cấu hình
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`); // Log thông tin khởi động server
});

// Đảm bảo closePool() được gọi khi ứng dụng dừng
process.on("SIGINT", async () => {
  console.log("Closing database connection..."); // Log thông tin đóng kết nối DB
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Closing database connection..."); // Log thông tin đóng kết nối DB
  await closePool();
  process.exit(0);
});

// Xử lý lỗi unhandledRejection (Promise rejection không được bắt)
process.on("unhandledRejection", (err: any) => {
  logger.error("unhandledRejection! 💥 Shutting down..."); // Log lỗi Promise rejection
  logger.error("Error Name: " + err.name);
  logger.error("Error Message: " + err.message);

  // Đóng server và dừng ứng dụng sau khi xử lý lỗi
  server.close(() => {
    process.exit(1); // Dừng ứng dụng khi không xử lý được Promise rejection
  });
});
