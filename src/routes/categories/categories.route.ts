import express from "express";
import { GetAllCategories } from "../../controllers/categories/categories.controller";

const router = express.Router();

router.route("/").get(GetAllCategories);

export default router;
