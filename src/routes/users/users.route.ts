import express from "express";
import {
  deleteUser,
  updateUser,
  validationUpdateUser,
} from "../../controllers/users/users.controller";
import {
  login,
  protect,
  restrictToOwnerOrRoles,
  signup,
  validationCreateUser,
} from "../../controllers/auth/auth.controller";
import { users } from "../../db/schema";

const router = express.Router();

router.route("/signup").post(validationCreateUser, signup);
router.route("/login").post(login);

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
