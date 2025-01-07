import multer from "multer";
import sharp from "sharp";
import CatchAsync from "../../utils/error/CatchAsync";
import ImageKit from "imagekit";
import AppError from "../../utils/error/AppError";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

// Sử dụng memoryStorage để giữ ảnh trong RAM, tránh lưu trữ vào đĩa
const storage = multer.memoryStorage();

// Kiểm tra file là ảnh hay không
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

// Giới hạn kích thước file (ví dụ 10MB)
const uploadImgUser = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn kích thước file lên tới 10MB
});

export const uploadImage = uploadImgUser.single("image");

export const resizeImage = (
  isResize: boolean,
  widthSize: number = 100,
  heightSize: number = 100
) => {
  return CatchAsync(async (req, res, next) => {
    if (!req.file) return next();

    // Chỉ resize nếu cần
    const processedImage = sharp(req.file.buffer)
      .toFormat("avif")
      .avif({ quality: 75 });

    if (isResize) {
      req.file.buffer = await processedImage
        .resize(widthSize, heightSize)
        .toBuffer();
    } else {
      req.file.buffer = await processedImage.toBuffer();
    }

    next();
  });
};

// Upload ảnh lên ImageKit
export const uploadToImageKit = (folder: string) => {
  return CatchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const filename = `${folder}-${(req as any).user.id}-${Date.now()}.avif`;

    const uploadedImage = await imagekit.upload({
      file: req.file.buffer, // Buffer của ảnh đã xử lý
      fileName: filename, // Tên file trên ImageKit
      folder, // Thư mục trên ImageKit (nếu muốn tổ chức)
      useUniqueFileName: false, // Sử dụng tên file duy nhất
    });

    // Xoá ảnh cũ nếu có
    try {
      if ((req as any).user.file_id)
        await imagekit.deleteFile((req as any).user.file_id);
    } catch (error) {
      console.error(error);
    }

    req.body.fileId = uploadedImage.fileId;
    req.body.image = uploadedImage.url;

    next();
  });
};
