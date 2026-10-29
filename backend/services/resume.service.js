
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_EXTRACTED_TEXT_LENGTH = 100_000;

export const extractResumeText = async (file) => {
  if (!file?.buffer || !file?.mimetype) {
    throw new Error("A valid uploaded file is required.");
  }

  let text = "";

  switch (file.mimetype) {
    case "application/pdf": {
      const parser = new PDFParse({ data: file.buffer });

      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        await parser.destroy();
      }

      break;
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({
        buffer: file.buffer,
      });

      text = result.value;
      break;
    }

    default: {
      const error = new Error("Unsupported resume format.");
      error.status = 400;
      throw error;
    }
  }

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) {
    const error = new Error(
      "No readable text found. The PDF may be scanned or empty."
    );
    error.status = 422;
    throw error;
  }

  return text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
};
