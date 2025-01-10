import express from "express";
import {
  createProject,
  getAllProject,
  getProjectBySlug,
  updateProject,
  validateCreateProject,
} from "../../controllers/projects/projects.controller";
import {
  resizeImageOneAndMany,
  uploadOneAndManyAndVideo,
  uploadToIkOneAndManyAndVideo,
} from "../../controllers/upload/upload.controller";

const router = express.Router();

router
  .route("/")
  .get(getAllProject)
  .post(
    uploadOneAndManyAndVideo,
    resizeImageOneAndMany(false),
    uploadToIkOneAndManyAndVideo("projects"),
    validateCreateProject,
    createProject
  );

router.route("/:slug").get(getProjectBySlug).patch(updateProject);

export default router;
