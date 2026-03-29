import Groq from "groq-sdk";
import { pipeline } from "@xenova/transformers";
import config from "../config/index.js";

const provider = config.llm.provider;
const OLLAMA_URL = config.llm.ollamaUrl;
const OLLAMA_MODEL = config.llm.ollamaModel;
const GROQ_API_KEY = config.llm.groqKey;
const GROQ_MODEL = config.llm.groqModel;
const EMBEDDING_MODEL = config.llm.embeddingModel;

const groqClient = provider === "groq" ? new Groq({ apiKey: GROQ_API_KEY }) : null;
const embeddingPipelinePromise = pipeline("feature-extraction", EMBEDDING_MODEL);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (operation) => {
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      await sleep(1000);
    }
  }

  throw lastError;
};

const generateWithOllama = async (prompt, systemPrompt) => {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      system: systemPrompt,
      stream: false,
      options: { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Ollama request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const text = String(data?.response || "").trim();
  if (!text) {
    throw new Error("Ollama returned an empty response.");
  }

  return text;
};

const generateWithGroq = async (prompt, systemPrompt) => {
  const completion = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.3,
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ],
  });

  const text = String(completion.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    throw new Error("Groq returned an empty response.");
  }

  return text;
};

const generateText = async (prompt, systemPrompt = "") =>
  withRetry(() =>
    provider === "groq"
      ? generateWithGroq(prompt, systemPrompt)
      : generateWithOllama(prompt, systemPrompt)
  );

const generateEmbedding = async (text) => {
  const extractor = await embeddingPipelinePromise;
  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output?.data || []);
};

const isOllamaAvailable = async () => {
  const response = await fetch(`${OLLAMA_URL}/api/tags`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Ollama health check failed with status ${response.status}.`);
  }

  return { ok: true, provider, model: OLLAMA_MODEL };
};

const isGroqAvailable = async () => {
  await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 1,
    temperature: 0,
    messages: [{ role: "user", content: "ping" }],
  });

  return { ok: true, provider, model: GROQ_MODEL };
};

const isAvailable = async () => {
  try {
    return await withRetry(() =>
      provider === "groq" ? isGroqAvailable() : isOllamaAvailable()
    );
  } catch {
    return {
      ok: false,
      provider,
      model: provider === "groq" ? GROQ_MODEL : OLLAMA_MODEL,
    };
  }
};

export const llm = {
  generateText,
  generateEmbedding,
  isAvailable,
};

export { generateText, generateEmbedding, isAvailable };
