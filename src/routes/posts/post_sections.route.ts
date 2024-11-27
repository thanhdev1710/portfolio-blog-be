import express from "express";
import {
  createPostSections,
  validatePostSection,
} from "../../controllers/posts/post_sections.controller";

const router = express.Router({ mergeParams: true });

router.route("/").post(validatePostSection, createPostSections);

export default router;
