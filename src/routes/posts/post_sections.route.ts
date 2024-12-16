import express from "express";
import {
  createPostSections,
  getPostSectionById,
  updateSectionOrder,
  validatePostSection,
} from "../../controllers/posts/post_sections.controller";
import {
  protect,
  restrictToOwnerOrRoles,
} from "../../controllers/auth/auth.controller";
import { posts } from "../../db/schema";

const router = express.Router({ mergeParams: true });

router.route("/").get(getPostSectionById);

router
  .route("/update-order")
  .put(
    protect,
    restrictToOwnerOrRoles(["admin", "editor"], posts, posts.id, posts.userId),
    updateSectionOrder
  );

router
  .route("/")
  .post(
    protect,
    restrictToOwnerOrRoles(["admin", "editor"], posts, posts.id, posts.userId),
    validatePostSection,
    createPostSections
  );

export default router;
