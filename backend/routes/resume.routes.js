
import express from "express";

import {
  uploadResume,
  getResumeById,
  analyzeResume,
  getResumeMatches,
} from "../controllers/resume.controller.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Upload a resume
router.post("/upload", upload.single("resume"), uploadResume);

// Get a resume and its extracted information
router.get("/:id", getResumeById);

// Analyze a resume using AI
router.post("/:id/analyze", analyzeResume);

// Match a resume against all jobs in the database
router.get("/:id/matches", getResumeMatches);

export default router;
