import express from "express";
import {
  deleteMe,
  deleteUser,
  getMe,
  updateMe,
  updateRole,
  updateUser,
  validationUpdateMe,
  validationUpdateRole,
  validationUpdateUser,
} from "../../controllers/users/users.controller";
import {
  forgotPassword,
  login,
  protect,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
  validationCreateUser,
  validationResetPasswordUser,
  validationUpdatePasswordUser,
} from "../../controllers/auth/auth.controller";
import {
  uploadToIk,
  uploadImage,
  resizeImage,
} from "../../controllers/upload/upload.controller";

const router = express.Router();

router.route("/signup").post(validationCreateUser, signup);
router.route("/login").post(login);

router.route("/forgotPassword").post(forgotPassword);
router
  .route("/resetPassword/:token")
  .patch(validationResetPasswordUser, resetPassword);

router
  .route("/updatePassword")
  .patch(protect, validationUpdatePasswordUser, updatePassword);

router.route("/getMe").get(protect, getMe);

router
  .route("/updateMe")
  .patch(
    protect,
    validationUpdateMe,
    uploadImage,
    resizeImage(true),
    uploadToIk("/user-img"),
    updateMe
  );
router.route("/deleteMe").delete(protect, deleteMe);

router
  .route("/updateRole")
  .post(protect, restrictTo(["admin"]), validationUpdateRole, updateRole);

router
  .route("/:id")
  .put(protect, restrictTo(["admin"]), validationUpdateUser, updateUser)
  .delete(protect, restrictTo(["admin"]), deleteUser);

export default router;
