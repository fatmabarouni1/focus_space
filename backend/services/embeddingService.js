import { embedWithOllama } from "../config/ollama.js";

const createEmbedding = async (text) => {
  return embedWithOllama({ input: text });
};

export { createEmbedding };
