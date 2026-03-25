import path from "path";
import ModuleDocument from "../models/ModuleDocument.js";
import DocumentChunk from "../models/DocumentChunk.js";
import RevisionModule from "../models/RevisionModule.js";
import { extractPdfText } from "../utils/pdfText.js";
import { splitTextIntoChunks } from "./chunkingService.js";
import { createEmbedding } from "./embeddingService.js";
import { ApiError } from "../utils/errors.js";

const processDocumentForAi = async ({ document }) => {
  if (!document) {
    throw new ApiError(404, "NOT_FOUND", "Document not found.");
  }

  const filePath = path.resolve("uploads", document.filename);
  await ModuleDocument.updateOne(
    { _id: document._id },
    {
      aiEmbeddingStatus: "processing",
      aiProcessingError: null,
      aiLastProcessedAt: new Date(),
    }
  );

  try {
    const extracted =
      document.extractedText?.trim()
        ? {
            text: document.extractedText,
            chars: document.extractedChars || document.extractedText.length,
            error: document.extractionError,
          }
        : await extractPdfText(filePath);

    if (!extracted.text?.trim()) {
      throw new ApiError(
        400,
        "DOCUMENT_TEXT_EMPTY",
        "No extractable text was found in this document."
      );
    }

    const chunks = splitTextIntoChunks(extracted.text, {
      targetWords: 700,
      overlapWords: 120,
    });

    if (chunks.length === 0) {
      throw new ApiError(
        400,
        "DOCUMENT_TEXT_EMPTY",
        "Document could not be chunked for AI processing."
      );
    }

    await DocumentChunk.deleteMany({ documentId: document._id });

    let embeddingDimensions = null;
    let embeddingModel = null;
    const chunkDocuments = [];

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const embedded = await createEmbedding(chunk.text);
      embeddingDimensions = embedded.dimensions;
      embeddingModel = embedded.model;

      chunkDocuments.push({
        userId: document.user_id,
        moduleId: document.module_id,
        documentId: document._id,
        chunkIndex: index,
        text: chunk.text,
        tokenEstimate: chunk.tokenEstimate,
        embedding: embedded.embedding,
        embeddingModel: embedded.model,
        sourceLabel: document.originalName,
        metadata: chunk.metadata,
      });
    }

    await DocumentChunk.insertMany(chunkDocuments, { ordered: true });

    await ModuleDocument.updateOne(
      { _id: document._id },
      {
        extractedText: extracted.text,
        extractedChars: extracted.chars ?? extracted.text.length,
        extractedAt: new Date(),
        extractionError: extracted.error ?? null,
        aiEmbeddingStatus: "ready",
        aiEmbeddingModel: embeddingModel,
        aiEmbeddingDimensions: embeddingDimensions,
        aiChunksCount: chunkDocuments.length,
        aiIndexedAt: new Date(),
        aiLastProcessedAt: new Date(),
        aiProcessingError: null,
      }
    );

    await RevisionModule.updateOne(
      { _id: document.module_id, user_id: document.user_id },
      { updated_at: new Date() }
    );

    return {
      chunksCount: chunkDocuments.length,
      embeddingModel,
      embeddingDimensions,
    };
  } catch (error) {
    await ModuleDocument.updateOne(
      { _id: document._id },
      {
        aiEmbeddingStatus: "failed",
        aiProcessingError: error.message,
        aiLastProcessedAt: new Date(),
      }
    );
    throw error;
  }
};

export { processDocumentForAi };
