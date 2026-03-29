import { llm } from "./llm.js";

const createEmbedding = async (text) => {
  const embedding = await llm.generateEmbedding(text);
  return {
    embedding,
    model: process.env.EMBEDDING_MODEL || "Xenova/nomic-embed-text-v1",
    dimensions: embedding.length,
  };
};

export { createEmbedding };
