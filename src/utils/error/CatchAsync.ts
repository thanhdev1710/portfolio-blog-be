import { NextFunction, Request, Response } from "express";

// Định nghĩa kiểu middleware bất đồng bộ
type AsyncMiddleWare = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// Hàm CatchAsync giúp bắt lỗi trong các middleware bất đồng bộ
export default function CatchAsync(fn: AsyncMiddleWare) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next); // Bắt lỗi và chuyển cho middleware xử lý lỗi
  };
}
