import express from "express";
import { protect } from "../../controllers/auth/auth.controller";
import {
  getBookmark,
  handleBookmark,
  validateBookmark,
} from "../../controllers/bookmark/bookmark.controller";

const router = express.Router();

router
  .route("/")
  .get(protect, getBookmark)
  .post(protect, validateBookmark, handleBookmark);

export default router;
