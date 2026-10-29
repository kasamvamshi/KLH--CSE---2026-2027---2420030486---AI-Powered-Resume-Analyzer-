
import mongoose from "mongoose";

import Resume from "../models/resume.model.js";
import Job from "../models/job.model.js";
import { extractResumeText } from "../services/resume.service.js";
import { analyzeResumeContent } from "../services/analysis.service.js";
import { matchResumeToJob } from "../services/matching.service.js";

// POST /api/resumes/upload
export const uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a resume file.",
            });
        }

        const extractedText = await extractResumeText(req.file);

        if (!extractedText || !extractedText.trim()) {
            return res.status(422).json({
                success: false,
                message: "Could not extract text from the uploaded resume.",
            });
        }

        const resume = await Resume.create({
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            extractedText,
            analysis: null,
        });

        return res.status(201).json({
            success: true,
            message: "Resume uploaded successfully.",
            data: {
                id: resume._id,
                originalName: resume.originalName,
                extractedText: resume.extractedText,
                createdAt: resume.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/resumes/:id
export const getResumeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID.",
            });
        }

        const resume = await Resume.findById(id).select("-__v");

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: resume,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/resumes/:id/analyze
export const analyzeResume = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID.",
            });
        }

        const resume = await Resume.findById(id);

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        const analysis = await analyzeResumeContent(resume.extractedText);

        resume.analysis = analysis;
        await resume.save();

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully.",
            data: {
                resumeId: resume._id,
                analysis: resume.analysis,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/resumes/:id/matches
export const getResumeMatches = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID.",
            });
        }

        const resume = await Resume.findById(id);

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        // Fetch every job in the database
        const jobs = await Job.find({})
            .select("-__v")
            .lean();

        console.log(
            jobs.find((job) => job.title === "Backend Developer")
        );

        // Calculate a match score for every job
        const matches = await Promise.all(
            jobs.map(async (job) => {
                const match = await matchResumeToJob({
                    resumeText: resume.extractedText,
                    resumeAnalysis: resume.analysis,
                    job,
                });

                return {
                    jobId: job._id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    experienceLevel: job.experienceLevel,
                    match,
                };
            })
        );


        // Highest match scores first; jobs without required skills go last
        matches.sort((a, b) => {
            if (a.match.score === null) return 1;
            if (b.match.score === null) return -1;

            return b.match.score - a.match.score;
        });

        // Return only the top 5 matches
        const topMatches = matches.slice(0, 5);

        return res.status(200).json({
            success: true,
            message: "Top 5 job matches retrieved successfully.",
            data: {
                resumeId: resume._id,
                totalJobs: jobs.length,
                totalMatchesReturned: topMatches.length,
                matches: topMatches,
            },
        });

    } catch (error) {
        next(error);
    }
};
