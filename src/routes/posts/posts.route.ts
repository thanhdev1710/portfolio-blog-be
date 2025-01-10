import express from "express";
import {
  getAllPost,
  validatePost,
  createPost,
  updatePost,
  deletePost,
  getPostBySlug,
} from "../../controllers/posts/posts.controller";
import {
  protect,
  restrictTo,
  restrictToOwnerOrRoles,
} from "../../controllers/auth/auth.controller";
import { posts } from "../../db/schema";
import { recordView } from "../../controllers/view/view.controller";
import {
  resizeImage,
  uploadImage,
  uploadToIk,
} from "../../controllers/upload/upload.controller";

const router = express.Router();

router
  .route("/")
  .get(getAllPost)
  .post(
    protect,
    restrictTo(["admin", "author"]),
    uploadImage,
    resizeImage(false),
    uploadToIk("/post-img"),
    validatePost,
    createPost
  );

router
  .route("/:id")
  .put(
    protect,

    restrictTo(["admin", "author", "editor"]),
    restrictToOwnerOrRoles(["admin", "editor"], posts, posts.id, posts.userId),
    validatePost,
    updatePost
  )
  .delete(
    protect,
    restrictTo(["admin", "author", "editor"]),
    restrictToOwnerOrRoles(["admin", "editor"], posts, posts.id, posts.userId),
    deletePost
  );

router.route("/:slug").patch(recordView);
router.route("/:slug").get(getPostBySlug);

export default router;
