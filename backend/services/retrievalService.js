import mongoose from "mongoose";
import DocumentChunk from "../models/DocumentChunk.js";
import { createEmbedding } from "./embeddingService.js";
import { ApiError } from "../utils/errors.js";

const getVectorIndexName = () =>
  process.env.MONGODB_VECTOR_INDEX_NAME || "document_chunk_embeddings";

const retrieveRelevantChunks = async ({
  userId,
  documentId,
  question,
  limit = 5,
  candidateLimit = 40,
}) => {
  if (!mongoose.isValidObjectId(documentId)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid document id.");
  }

  const { embedding: queryVector } = await createEmbedding(question);

  try {
    const chunks = await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: getVectorIndexName(),
          path: "embedding",
          queryVector,
          numCandidates: candidateLimit,
          limit,
          filter: {
            userId: new mongoose.Types.ObjectId(userId),
            documentId: new mongoose.Types.ObjectId(documentId),
          },
        },
      },
      {
        $project: {
          text: 1,
          chunkIndex: 1,
          documentId: 1,
          sourceLabel: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    return chunks;
  } catch (error) {
    throw new ApiError(
      500,
      "VECTOR_SEARCH_FAILED",
      "MongoDB Atlas Vector Search query failed.",
      [{ path: "vectorSearch", message: error.message }]
    );
  }
};

export { retrieveRelevantChunks, getVectorIndexName };
