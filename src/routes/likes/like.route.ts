import express from "express";
import { protect } from "../../controllers/auth/auth.controller";
import {
  likePost,
  validateLikePost,
} from "../../controllers/likes/like.controller";

const router = express.Router();

router.route("/").post(protect, validateLikePost, likePost);

export default router;
