import { ApiError } from "../utils/errors.js";

const getOllamaConfig = () => ({
  baseUrl: (process.env.OLLAMA_BASE_URL || "").replace(/\/$/, ""),
  model: process.env.OLLAMA_MODEL || "",
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || process.env.OLLAMA_MODEL || "",
});

const assertOllamaConfigured = () => {
  const { baseUrl, model, embeddingModel } = getOllamaConfig();
  if (!baseUrl || !model || !embeddingModel) {
    throw new ApiError(
      500,
      "OLLAMA_NOT_CONFIGURED",
      "Ollama is not configured correctly."
    );
  }
};

const ollamaRequest = async (pathname, body) => {
  assertOllamaConfigured();
  const { baseUrl } = getOllamaConfig();

  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      502,
      "OLLAMA_REQUEST_FAILED",
      "Ollama request failed.",
      [{ path: pathname, message: errorText.slice(0, 500) || response.statusText }]
    );
  }

  return response.json();
};

const generateWithOllama = async ({
  prompt,
  system,
  model,
  temperature = 0.2,
  format = undefined,
}) => {
  const config = getOllamaConfig();
  const payload = await ollamaRequest("/api/generate", {
    model: model || config.model,
    prompt,
    system,
    stream: false,
    format,
    options: { temperature },
  });

  const response = payload?.response?.trim();
  if (!response) {
    throw new ApiError(502, "OLLAMA_EMPTY_RESPONSE", "Ollama returned an empty response.");
  }

  return response;
};

const embedWithOllama = async ({ input, model }) => {
  const config = getOllamaConfig();
  const payload = await ollamaRequest("/api/embed", {
    model: model || config.embeddingModel,
    input,
  });

  const vector = payload?.embeddings?.[0];
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new ApiError(
      502,
      "OLLAMA_EMBEDDING_INVALID",
      "Ollama returned an invalid embedding."
    );
  }

  return {
    embedding: vector,
    model: model || config.embeddingModel,
    dimensions: vector.length,
  };
};

const checkOllamaAvailability = async () => {
  const config = getOllamaConfig();

  if (!config.baseUrl) {
    return {
      ok: false,
      message: "OLLAMA_BASE_URL is not configured.",
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Ollama tags request failed with status ${response.status}.`,
      };
    }

    const payload = await response.json();
    const models = Array.isArray(payload?.models) ? payload.models : [];
    const installedNames = new Set(
      models.flatMap((item) => [item?.name, item?.model].filter(Boolean))
    );
    const missing = [config.model, config.embeddingModel].filter(
      (name) => name && !installedNames.has(name)
    );

    if (missing.length > 0) {
      return {
        ok: false,
        message: `Configured Ollama model(s) not installed locally: ${missing.join(", ")}.`,
      };
    }

    return {
      ok: true,
      message: `Ollama ready. Chat model: ${config.model}. Embedding model: ${config.embeddingModel}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Ollama is unreachable: ${error.message}`,
    };
  }
};

export {
  getOllamaConfig,
  assertOllamaConfigured,
  generateWithOllama,
  embedWithOllama,
  checkOllamaAvailability,
};
