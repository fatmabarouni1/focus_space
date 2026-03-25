import fs from "fs/promises";
import pdf from "pdf-parse";

const MAX_EXTRACT_CHARS = 20000;

const extractPdfText = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    const text = (data?.text || "").replace(/\s+/g, " ").trim();
    const truncated = text.slice(0, MAX_EXTRACT_CHARS);
    return {
      text: truncated,
      chars: truncated.length,
      error: truncated.length === 0 ? "EMPTY_TEXT" : null,
    };
  } catch (error) {
    return { text: "", chars: 0, error: "EXTRACTION_FAILED" };
  }
};

export { extractPdfText, MAX_EXTRACT_CHARS };
