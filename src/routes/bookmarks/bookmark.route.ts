import express from "express";
import { protect } from "../../controllers/auth/auth.controller";
import {
  handleBookmark,
  validateBookmark,
} from "../../controllers/bookmark/bookmark.controller";

const router = express.Router();

router.route("/").post(protect, validateBookmark, handleBookmark);

export default router;
