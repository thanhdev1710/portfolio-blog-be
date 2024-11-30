import express from "express";
import { subscribe } from "../../controllers/email/email.controller";
const router = express.Router();

router.route("/subscribe").post(subscribe);

export default router;
