
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const jobSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        company: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        requiredSkills: {
            type: [String],
            default: [],
        },

        preferredSkills: {
            type: [String],
            default: [],
        },

        location: {
            type: String,
            trim: true,
            default: "Not specified",
        },

        experienceLevel: {
            type: String,
            enum: [
                "Internship",
                "Entry-level",
                "Mid-level",
                "Senior",
                "Not specified",
            ],
            default: "Not specified",
        },
    },
    {
        timestamps: true,
    }
);

// Useful for filtering jobs by title and company
jobSchema.index({ title: 1, company: 1 });

const Job = model("Job", jobSchema);

export default Job;
