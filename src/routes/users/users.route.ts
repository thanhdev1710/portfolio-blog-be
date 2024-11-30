import express from "express";
import {
  deleteUser,
  updateRole,
  updateUser,
  validationUpdateRole,
  validationUpdateUser,
} from "../../controllers/users/users.controller";
import {
  forgotPassword,
  login,
  protect,
  resetPassword,
  restrictTo,
  restrictToOwnerOrRoles,
  signup,
  validationCreateUser,
  validationResetPasswordUser,
} from "../../controllers/auth/auth.controller";
import { users } from "../../db/schema";

const router = express.Router();

router.route("/signup").post(validationCreateUser, signup);
router.route("/login").post(login);

router.route("/forgotPassword").post(forgotPassword);
router
  .route("/resetPassword/:token")
  .patch(validationResetPasswordUser, resetPassword);

router
  .route("/updateRole")
  .post(protect, restrictTo(["admin"]), validationUpdateRole, updateRole);

router
  .route("/:id")
  .put(
    protect,
    restrictToOwnerOrRoles(["admin"], users, users.id, users.id),
    validationUpdateUser,
    updateUser
  )
  .delete(
    protect,
    restrictToOwnerOrRoles(["admin"], users, users.id, users.id),
    deleteUser
  );

export default router;
