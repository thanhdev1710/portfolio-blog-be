import multer from "multer";
import AppError from "../../utils/error/AppError";
import ImageKit from "imagekit";
import CatchAsync from "../../utils/error/CatchAsync";
import sharp from "sharp";

function toMB(n: number) {
  return n * 1024 * 1024;
}

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.fieldname.startsWith("image")) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Only image files are allowed for the 'image' field.",
          400
        ),
        false
      );
    }
  } else if (file.fieldname.startsWith("video")) {
    if (file.mimetype.startsWith("video")) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Only video files are allowed for the 'video' field.",
          400
        ),
        false
      );
    }
  } else {
    cb(new AppError("Invalid file type.", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: toMB(10),
  },
});

export const uploadImage = upload.single("image");
export const uploadImages = upload.array("images");
export const uploadOneAndManyAndVideo = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
]);

export const resizeImage = (
  isResize: boolean,
  widthSize: number = 100,
  heightSize: number = 100
) => {
  return CatchAsync(async (req, res, next) => {
    if (!req.file) return next();

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

export const uploadToIk = (folder: string) => {
  return CatchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const fileName = `${folder}-${(req as any).user.id}-${Date.now()}.avif`;

    const uploadedImage = await ik.upload({
      file: req.file.buffer,
      fileName,
      folder,
      useUniqueFileName: false,
    });

    try {
      if ((req as any).user.file_id)
        await ik.deleteFile((req as any).user.file_id);
    } catch (error) {
      console.error(error);
    }

    req.body.fileId = uploadedImage.fileId;
    req.body.image = uploadedImage.url;

    next();
  });
};

export const resizeImageOneAndMany = (
  isResize: boolean,
  widthSize: number = 100,
  heightSize: number = 100
) => {
  return CatchAsync(async (req, res, next) => {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    if (!files?.["image"] && !files?.["images"]) return next();

    const image = files["image"][0]; // Kiểm tra file đơn
    const images = files["images"]; // Kiểm tra danh sách file

    const processImgs: Promise<void>[] = [];

    if (images) {
      images.forEach((file) => {
        processImgs.push(
          sharp(file.buffer)
            .resize(
              isResize ? widthSize : undefined,
              isResize ? heightSize : undefined
            )
            .toFormat("avif")
            .avif({ quality: 75 })
            .toBuffer()
            .then((buffer) => {
              file.buffer = buffer; // Cập nhật buffer sau khi xử lý
            })
        );
      });
    }

    if (image) {
      processImgs.push(
        sharp(image.buffer)
          .resize(
            isResize ? widthSize : undefined,
            isResize ? heightSize : undefined
          )
          .toFormat("avif")
          .avif({ quality: 75 })
          .toBuffer()
          .then((buffer) => {
            image.buffer = buffer;
          })
      );
    }

    await Promise.all(processImgs);

    return next();
  });
};

export const uploadToIkOneAndManyAndVideo = (folder: string) => {
  return CatchAsync(async (req, res, next) => {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    if (!files?.["image"] && !files?.["images"] && !files?.["video"])
      return next();

    const image = files["image"][0];
    const video = files["video"][0];
    const images = files["images"];

    const processImgs: Promise<void>[] = [];

    if (images) {
      images.forEach((file) =>
        processImgs.push(
          ik
            .upload({
              file: file.buffer,
              fileName: `thanhdev.avif`,
              folder: folder + "/images",
            })
            .then((value) => {
              if (!req.body.images) {
                req.body.images = [];
              }
              req.body.images.push(value.url);
            })
        )
      );
    }

    if (image) {
      processImgs.push(
        ik
          .upload({
            file: image.buffer,
            fileName: `thanhdev.avif`,
            folder: folder + "/images",
          })
          .then((value) => {
            req.body.image = value.url;
          })
      );
    }

    if (video) {
      processImgs.push(
        ik
          .upload({
            file: video.buffer,
            fileName: `thanhdev.${video.mimetype.split("/")[1]}`,
            folder: folder + "/videos",
          })
          .then((value) => {
            req.body.video = value.url;
          })
      );
    }

    await Promise.all(processImgs);

    next();
  });
};
