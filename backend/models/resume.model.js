
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const resumeSchema = new Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
      enum: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    },

    extractedText: {
      type: String,
      required: true,
      trim: true,
    },

    analysis: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = model("Resume", resumeSchema);

export default Resume;
