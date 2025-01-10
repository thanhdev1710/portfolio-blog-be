import { createLogger, format, transports } from "winston";
import path from "path";
import fs from "fs";

// Tạo thư mục logs nếu chưa có
const logDirectory = path.join(__dirname, "../logs");

// Kiểm tra và tạo thư mục logs nếu chưa có
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Cấu hình logger
const logger = createLogger({
  level: "info", // Mức độ log mặc định
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  defaultMeta: { service: "user-service" },
  transports: [
    // Ghi log vào tệp error.log chỉ ghi log lỗi trong thư mục logs
    new transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
    // Ghi tất cả các log vào tệp combined.log trong thư mục logs
    new transports.File({
      filename: path.join(logDirectory, "combined.log"),
    }),
  ],
});

// Nếu ứng dụng chạy trong môi trường phát triển, thêm log vào console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;
