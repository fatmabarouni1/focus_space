import ModuleDocument from "../models/ModuleDocument.js";
import StudyChat from "../models/StudyChat.js";
import { llm } from "./llm.js";
import { retrieveRelevantChunks } from "./retrievalService.js";
import { ApiError } from "../utils/errors.js";

const MODE_INSTRUCTIONS = {
  simple:
    "Explain in simple words for a student who needs a concise, easy-to-understand answer.",
  detailed:
    "Give a precise, structured answer with enough detail for revision, using bullet points when useful.",
  example:
    "Explain clearly and include at least one concrete example grounded in the document.",
};

const answerQuestionWithDocument = async ({
  userId,
  documentId,
  question,
  mode = "detailed",
}) => {
  const document = await ModuleDocument.findOne({
    _id: documentId,
    user_id: userId,
  }).lean();

  if (!document) {
    throw new ApiError(404, "NOT_FOUND", "Document not found.");
  }

  if (document.aiEmbeddingStatus !== "ready") {
    throw new ApiError(
      409,
      "DOCUMENT_NOT_INDEXED",
      "Document is not indexed for AI retrieval yet."
    );
  }

  const chunks = await retrieveRelevantChunks({
    userId,
    documentId,
    question,
    limit: 5,
  });

  if (chunks.length === 0) {
    throw new ApiError(
      404,
      "NO_CONTEXT_FOUND",
      "No relevant document context was found for this question."
    );
  }

  const context = chunks
    .map(
      (chunk) =>
        `Source ${chunk.chunkIndex} (${chunk.sourceLabel}):\n${chunk.text}`
    )
    .join("\n\n");

  const answer = await llm.generateText(
    `Question:\n${question}\n\nDocument context:\n${context}`,
    [
      "You are an AI study companion.",
      "Answer only using the supplied document context.",
      "If the answer is not clearly supported by the context, say that explicitly.",
      MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.detailed,
    ].join(" ")
  );

  if (!answer) {
    throw new ApiError(502, "OLLAMA_EMPTY_RESPONSE", "Ollama returned an empty answer.");
  }

  const sources = chunks.map((chunk) => ({
    chunkId: chunk._id,
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    sourceLabel: chunk.sourceLabel,
    snippet: chunk.text.slice(0, 240),
    score: chunk.score,
  }));

  const chat = await StudyChat.create({
    userId,
    moduleId: document.module_id,
    documentId: document._id,
    question,
    mode,
    answer,
    sources,
  });

  return { chat, answer, sources };
};

export { answerQuestionWithDocument };
