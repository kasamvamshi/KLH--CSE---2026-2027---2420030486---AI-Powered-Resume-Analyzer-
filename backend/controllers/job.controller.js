
import mongoose from "mongoose";

import Job from "../models/job.model.js";
import Resume from "../models/resume.model.js";
import { matchResumeToJob } from "../services/matching.service.js";

// POST /api/jobs
export const createJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      description,
      requiredSkills,
      preferredSkills,
      location,
      experienceLevel,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof company !== "string" ||
      !company.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, company, and description are required.",
      });
    }

    for (const [field, skills] of Object.entries({
      requiredSkills,
      preferredSkills,
    })) {
      if (
        skills !== undefined &&
        (!Array.isArray(skills) ||
          !skills.every(
            (skill) =>
              typeof skill === "string" && skill.trim().length > 0
          ))
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be an array of non-empty strings.`,
        });
      }
    }

    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      requiredSkills: requiredSkills ?? [],
      preferredSkills: preferredSkills ?? [],
      location,
      experienceLevel,
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully.",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/jobs?page=1&limit=10&search=developer
export const getAllJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = {};

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const escapedSearch = req.query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { company: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-__v"),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id
export const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    const job = await Job.findById(id).select("-__v");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id/matches/:resumeId
export const getJobMatches = async (req, res, next) => {
  try {
    const { id, resumeId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(resumeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID or resume ID.",
      });
    }

    const [job, resume] = await Promise.all([
      Job.findById(id),
      Resume.findById(resumeId),
    ]);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    const match = await matchResumeToJob({
      resumeText: resume.extractedText,
      job,
    });

    return res.status(200).json({
      success: true,
      data: {
        jobId: job._id,
        resumeId: resume._id,
        match,
      },
    });
  } catch (error) {
    next(error);
  }
};
