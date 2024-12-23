import express from "express";
import {
  createComment,
  deleteComment,
  getCommentByPostId,
  updateComment,
  ValidateComment,
  ValidateCommentUpdate,
} from "../../controllers/comments/comment.controller";
import {
  protect,
  restrictToOwnerOrRoles,
} from "../../controllers/auth/auth.controller";
import { comments } from "../../db/schema";

const router = express.Router();

router.route("/").post(protect, ValidateComment, createComment);

router.route("/:postId/:viewerId").get(getCommentByPostId);

router
  .route("/:id")
  .patch(
    protect,
    restrictToOwnerOrRoles(["admin"], comments, comments.id, comments.userId),
    ValidateCommentUpdate,
    updateComment
  )
  .delete(
    protect,
    restrictToOwnerOrRoles(["admin"], comments, comments.id, comments.userId),
    deleteComment
  );

export default router;
