import express from "express";

import {
  createJob,
  getAllJobs,
  getJobById,
  getJobMatches,
} from "../controllers/job.controller.js";

const router = express.Router();

// Create a job listing
router.post("/", createJob);

// List jobs, with optional filters and pagination
router.get("/", getAllJobs);

// Get a specific job
router.get("/:id", getJobById);

// Match a resume against a particular job
router.get("/:id/matches/:resumeId", getJobMatches);

export default router;
