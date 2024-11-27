// Lớp AppError tùy chỉnh để xử lý lỗi trong ứng dụng
export default class AppError extends Error {
  public statusCode: number; // Mã trạng thái HTTP
  public status: string; // Trạng thái lỗi ('fail' hoặc 'error')
  public isOperational: boolean; // Đánh dấu lỗi có thể xử lý được
  public errors: any[] | undefined;

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message); // Gọi constructor của Error để tạo thông điệp lỗi

    // Gán mã trạng thái và xác định trạng thái lỗi (fail cho 4xx, error cho các mã còn lại)
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Đánh dấu đây là lỗi có thể xử lý
    this.errors = errors;
    // Captures stack trace để dễ dàng gỡ lỗi
    Error.captureStackTrace(this, this.constructor);
  }
}
