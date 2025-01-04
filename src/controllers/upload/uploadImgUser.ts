import multer from "multer";
import sharp from "sharp";
import CatchAsync from "../../utils/error/CatchAsync";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

const storage = multer.memoryStorage();
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const uploadImgUser = multer({
  storage,
  fileFilter,
});

export const uploadImage = uploadImgUser.single("image");

export const resizeImage = (
  isResize: boolean,
  withSize: number = 100,
  heightSize: number = 100
) => {
  return CatchAsync(async (req, res, next) => {
    if (!req.file) return next();

    if (isResize) {
      req.file.buffer = await sharp(req.file.buffer)
        .resize(withSize, heightSize)
        .toFormat("avif")
        .avif({ quality: 75 })
        .toBuffer();
    } else {
      req.file.buffer = await sharp(req.file.buffer)
        .toFormat("avif")
        .avif({ quality: 75 })
        .toBuffer();
    }

    next();
  });
};

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

    try {
      if ((req as any).user.file_id)
        await imagekit.deleteFile((req as any).user.file_id);
    } catch (error) {
      console.log(error);
    }

    req.body.fileId = uploadedImage.fileId;
    req.body.image = uploadedImage.url;

    next();
  });
};
