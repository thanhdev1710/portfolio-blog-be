import express from "express";
import { GetAllHashtag } from "../../controllers/hashtag/hashtags.controller";

const router = express.Router();

router.route("/").get(GetAllHashtag);

export default router;
