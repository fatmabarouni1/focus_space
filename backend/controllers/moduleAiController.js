import RevisionModule from "../models/RevisionModule.js";
import ModuleNote from "../models/ModuleNote.js";
import ModuleLink from "../models/ModuleLink.js";
import ModuleDocument from "../models/ModuleDocument.js";
import ModuleAIOutput from "../models/ModuleAIOutput.js";
import { sendError } from "../utils/errors.js";
import { extractPdfText } from "../utils/pdfText.js";
import path from "path";

const NOTES_MAX_CHARS = 4000;
const PDF_MAX_CHARS = 8000;
const CACHE_HOURS = 24;
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "";
const isProduction = process.env.NODE_ENV === "production";

const truncateText = (value, maxChars) => {
  if (!value) return "";
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...`;
};

const buildContextSnapshot = (module, note, links, documents, pdfText) => ({
  moduleTitle: module.title || "",
  notesText: truncateText(note?.content ?? "", NOTES_MAX_CHARS),
  links: links.map((link) => ({
    title: link.title || "",
    url: link.url || "",
  })),
  pdfText,
});

const loadModuleContext = async (req) => {
  const module = await RevisionModule.findOne({
    _id: req.params.moduleId,
    user_id: req.user.id,
  });

  if (!module) {
    return { module: null };
  }

  const [note, links, documents] = await Promise.all([
    ModuleNote.findOne({ module_id: module._id, user_id: req.user.id }),
    ModuleLink.find({ module_id: module._id, user_id: req.user.id }).sort({
      created_at: -1,
    }),
    ModuleDocument.find({ module_id: module._id, user_id: req.user.id }).sort({
      uploadedAt: -1,
    }),
  ]);

  let pdfTextChunks = [];
  let extractedChars = 0;
  let pdfTextIncluded = false;
  let pdfExtractionWarning = false;

  for (const doc of documents) {
    const isPdf = doc.mime_type === "application/pdf";
    if (!isPdf) continue;

    if (!doc.extractedAt) {
      const filePath = path.resolve("uploads", doc.filename);
      const extracted = await extractPdfText(filePath);
      doc.extractedText = extracted.text;
      doc.extractedChars = extracted.chars;
      doc.extractedAt = new Date();
      doc.extractionError = extracted.error;
      await doc.save();
    }

    if (doc.extractedText) {
      pdfTextChunks.push(doc.extractedText);
      extractedChars += doc.extractedText.length;
      pdfTextIncluded = true;
    } else {
      pdfExtractionWarning = true;
    }
  }

  const pdfText = truncateText(pdfTextChunks.join("\n\n"), PDF_MAX_CHARS);
  const snapshot = buildContextSnapshot(module, note, links, documents, pdfText);
  const notesIncluded = Boolean(snapshot.notesText && snapshot.notesText.trim());

  return {
    module,
    snapshot,
    meta: {
      notesIncluded,
      pdfTextIncluded,
      extractedChars,
      pdfExtractionWarning,
    },
  };
};

const getRecentCache = async (userId, moduleId, type) => {
  const since = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000);
  return ModuleAIOutput.findOne({
    userId,
    moduleId,
    type,
    createdAt: { $gte: since },
  }).sort({ createdAt: -1 });
};

const tryParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const logSummaryJsonFailure = (stage, raw) => {
  if (isProduction) {
    return;
  }

  console.warn(`[SUMMARY_DEBUG] Ollama returned invalid JSON during ${stage}.`);
  console.warn(raw?.slice(0, 2000) || "<empty>");
};

const toCleanString = (value) => String(value ?? "").trim();

const normalizeDefinitionItem = (item) => {
  if (!item) return null;

  if (typeof item === "string") {
    const [term, ...rest] = item.split(":");
    return {
      term: toCleanString(term) || "Term",
      definition: toCleanString(rest.join(":")) || item.trim(),
    };
  }

  const term = toCleanString(item.term);
  const definition = toCleanString(item.definition);

  if (!term && !definition) {
    return null;
  }

  return {
    term: term || "Term",
    definition: definition || "Definition not clearly stated.",
  };
};

const normalizeSummaryOutput = (output, snapshot) => {
  const raw = output && typeof output === "object" ? output : {};
  const title = toCleanString(raw.title) || toCleanString(snapshot.moduleTitle) || "Study Summary";
  const keyConcepts = Array.isArray(raw.keyConcepts)
    ? raw.keyConcepts.map((item) => toCleanString(item)).filter(Boolean)
    : [];
  const mainIdeas = Array.isArray(raw.mainIdeas)
    ? raw.mainIdeas.map((item) => toCleanString(item)).filter(Boolean)
    : [];
  const importantDefinitions = Array.isArray(raw.importantDefinitions)
    ? raw.importantDefinitions.map(normalizeDefinitionItem).filter(Boolean)
    : [];
  const keyTakeaways = Array.isArray(raw.keyTakeaways)
    ? raw.keyTakeaways.map((item) => toCleanString(item)).filter(Boolean)
    : [];

  const summary =
    toCleanString(raw.summary) ||
    [
      `Title: ${title}`,
      "",
      "Main Ideas:",
      ...(mainIdeas.length > 0
        ? mainIdeas.map((item) => `- ${item}`)
        : ["- No strong main ideas could be extracted."]),
      "",
      "Key Takeaways:",
      ...(keyTakeaways.length > 0
        ? keyTakeaways.map((item) => `- ${item}`)
        : ["- Review the source material again for the core ideas."]),
    ].join("\n");

  return {
    title,
    summary,
    keyConcepts,
    mainIdeas,
    importantDefinitions,
    keyTakeaways,
    keyPoints:
      keyConcepts.length > 0
        ? keyConcepts
        : keyTakeaways.length > 0
          ? keyTakeaways
          : ["No key concepts were clearly identified."],
    glossary:
      importantDefinitions.length > 0
        ? importantDefinitions
        : [{ term: "None", definition: "None clearly stated in the notes." }],
  };
};

const requestOllamaJson = async (prompt) => {
  if (!OLLAMA_BASE_URL || !OLLAMA_MODEL) {
    return null;
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.4 },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const raw = data?.response;
  if (!raw) return null;
  return raw.trim();
};

const buildPrompt = (type, snapshot, schema) => {
  if (type === "summary") {
    return [
      "You are a study assistant.",
      "Your task is to transform messy notes and noisy PDF text into a clean revision summary.",
      "Rules:",
      "- Do not repeat the raw input.",
      "- Ignore dates, headers, duplicated text, and formatting noise.",
      "- Reconstruct broken words when possible.",
      "- Write the result as if preparing revision notes for a student.",
      "- Keep only the useful academic content.",
      "- If the text is noisy, infer the most likely meaning from the context.",
      "- Use only information supported by the notes or PDF text.",
      "- Keep the summary clear, compact, and easy to revise before an exam.",
      "- Return only valid JSON with no markdown.",
      `Schema: ${schema}`,
      "Input:",
      "Notes:",
      snapshot.notesText || "N/A",
      "",
      "PDF text:",
      snapshot.pdfText || "N/A",
    ].join("\n");
  }

  return [
    "You are a study coach. Return ONLY valid JSON with no markdown.",
    `Schema: ${schema}`,
    `Module title (metadata only): ${snapshot.moduleTitle}`,
    "Use ONLY the provided sources. Do NOT assume content from the title alone.",
    `SOURCE NOTES: ${snapshot.notesText || "N/A"}`,
    `SOURCE PDF TEXT: ${snapshot.pdfText || "N/A"}`,
    `Links (optional context): ${
      snapshot.links.map((link) => `${link.title} - ${link.url}`).join(" | ") ||
      "N/A"
    }`,
    `Task: Generate a ${type} response that matches the schema exactly.`,
  ].join("\n");
};

const getSchemaForType = (type) => {
  if (type === "summary") {
    return `{
  "title": "detected topic",
  "summary": "short structured overview for quick review",
  "keyConcepts": ["...","...","...","..."],
  "mainIdeas": ["short explanation","short explanation","short explanation"],
  "importantDefinitions": [{"term":"","definition":""}],
  "keyTakeaways": ["...","...","..."],
  "keyPoints": ["...","...","...","..."],
  "glossary": [{"term":"","definition":""}]
}`;
  }
  if (type === "quiz") {
    return `{
  "questions": [
    { "type":"mcq", "question":"", "choices":["A","B","C","D"], "answerIndex":0, "explanation":"" },
    { "type":"short", "question":"", "answer":"", "explanation":"" }
  ]
}`;
  }
  return `{
  "recommendedResources": [
    { "title":"", "type":"video|course|article|documentation", "platform":"", "url":"", "whyThisHelps":"", "difficulty":"beginner|intermediate|advanced" }
  ]
}`;
};

const generateWithOllama = async (type, snapshot) => {
  const schema = getSchemaForType(type);
  const prompt = buildPrompt(type, snapshot, schema);

  const raw = await requestOllamaJson(prompt);
  if (!raw) return null;

  let parsed = tryParseJson(raw);
  if (parsed) {
    if (type === "summary") {
      return normalizeSummaryOutput(parsed, snapshot);
    }
    return parsed;
  }

  if (type === "summary") {
    logSummaryJsonFailure("initial parse", raw);
  }

  const retryPrompt = [
    "Fix the output to match the schema and return ONLY valid JSON.",
    `Schema: ${schema}`,
    `Invalid JSON: ${raw}`,
  ].join("\n");
  const retryRaw = await requestOllamaJson(retryPrompt);
  if (!retryRaw) return null;
  parsed = tryParseJson(retryRaw);
  if (!parsed) {
    if (type === "summary") {
      logSummaryJsonFailure("retry parse", retryRaw);
    }
    return null;
  }

  if (type === "summary") {
    return normalizeSummaryOutput(parsed, snapshot);
  }

  return parsed;
};

const buildTemplateSummary = (snapshot) => {
  const notesSnippet = snapshot.notesText
    ? snapshot.notesText.slice(0, 400)
    : "";
  const pdfSnippet = snapshot.pdfText ? snapshot.pdfText.slice(0, 400) : "";

  return normalizeSummaryOutput(
    {
      title: snapshot.moduleTitle || "Study Summary",
      keyConcepts: [
        snapshot.notesText ? "Core ideas from notes" : "",
        snapshot.pdfText ? "Supporting concepts from PDF text" : "",
        snapshot.links.length ? "Supplementary linked resources" : "",
      ].filter(Boolean),
      mainIdeas: [
        notesSnippet
          ? `Notes suggest: ${notesSnippet}${notesSnippet.length >= 400 ? "..." : ""}`
          : "No notes were provided for this module.",
        pdfSnippet
          ? `PDF highlights: ${pdfSnippet}${pdfSnippet.length >= 400 ? "..." : ""}`
          : "No PDF text was available to summarize.",
      ],
      importantDefinitions: [],
      keyTakeaways: [
        "Focus revision on the repeated concepts across notes and PDFs.",
        snapshot.links.length
          ? "Use the saved links to deepen understanding after reviewing the basics."
          : "Add curated links if you want more external explanations.",
      ],
    },
    snapshot
  );
};

const buildTemplateQuiz = (snapshot) => {
  const topic = snapshot.moduleTitle || "this module";
  return {
    questions: [
      {
        type: "mcq",
        question: `What is the primary focus of ${topic}?`,
        choices: ["Overview concepts", "Only trivia", "Unrelated topic", "None"],
        answerIndex: 0,
        explanation: "The module centers on core concepts and summaries.",
      },
      {
        type: "mcq",
        question: "Which item best supports revision?",
        choices: [
          "Key points and summaries",
          "Random unrelated links",
          "Skipping notes",
          "No materials",
        ],
        answerIndex: 0,
        explanation: "Key points and summaries help quick review.",
      },
      {
        type: "mcq",
        question: "How many resources should you aim to add?",
        choices: ["At least one useful resource", "Zero always", "Hundreds", "None"],
        answerIndex: 0,
        explanation: "A small curated set is most helpful.",
      },
      {
        type: "short",
        question: `Summarize the most important takeaway from ${topic}.`,
        answer: "A concise summary of the main idea.",
        explanation: "Focus on the core theme and outcomes.",
      },
    ],
  };
};

const buildTemplateResources = (snapshot) => {
  const resources = snapshot.links.length
    ? snapshot.links.slice(0, 3).map((link) => ({
        title: link.title || "Saved resource",
        type: "article",
        platform: "Saved Link",
        url: link.url,
        whyThisHelps: "Already curated for this module.",
        difficulty: "beginner",
      }))
    : [
        {
          title: `${snapshot.moduleTitle || "Module"} - Official documentation`,
          type: "documentation",
          platform: "Docs",
          url: "https://example.com",
          whyThisHelps: "Provides authoritative reference material.",
          difficulty: "beginner",
        },
        {
          title: `${snapshot.moduleTitle || "Module"} overview video`,
          type: "video",
          platform: "YouTube",
          url: "https://youtube.com",
          whyThisHelps: "Quick visual walkthrough of key ideas.",
          difficulty: "beginner",
        },
      ];

  return { recommendedResources: resources };
};

const buildTemplateOutput = (type, snapshot) => {
  if (type === "summary") return buildTemplateSummary(snapshot);
  if (type === "quiz") return buildTemplateQuiz(snapshot);
  return buildTemplateResources(snapshot);
};

const handleAiRequest = (type) => async (req, res) => {
  try {
    const { module, snapshot, meta } = await loadModuleContext(req);
    if (!module) {
      return sendError(res, 404, "NOT_FOUND", "Module not found.");
    }

    const cached =
      type === "summary"
        ? null
        : await getRecentCache(req.user.id, module._id, type);
    if (cached) {
      return res.json({
        cached: true,
        output: cached.outputJson,
        createdAt: cached.createdAt,
        meta: type === "summary" ? meta : undefined,
      });
    }

    let output = await generateWithOllama(type, snapshot);
    if (!output) {
      output = buildTemplateOutput(type, snapshot);
    }

    const created = await ModuleAIOutput.create({
      userId: req.user.id,
      moduleId: module._id,
      type,
      inputSnapshot: snapshot,
      outputJson: output,
    });

    return res.json({
      cached: false,
      output: created.outputJson,
      createdAt: created.createdAt,
      meta: type === "summary" ? meta : undefined,
    });
  } catch (error) {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to generate AI output.");
  }
};

const generateSummary = handleAiRequest("summary");
const generateQuiz = handleAiRequest("quiz");
const generateResources = handleAiRequest("resources");

export { generateSummary, generateQuiz, generateResources };
