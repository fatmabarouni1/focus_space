import RevisionModule from "../models/RevisionModule.js";
import ModuleNote from "../models/ModuleNote.js";
import ModuleLink from "../models/ModuleLink.js";
import ModuleDocument from "../models/ModuleDocument.js";
import ModuleAIOutput from "../models/ModuleAIOutput.js";
import { llm } from "../services/llm.js";
import logger from "../utils/logger.js";
import { sendError } from "../utils/errors.js";
import { extractPdfText } from "../utils/pdfText.js";
import path from "path";

const NOTES_MAX_CHARS = 4000;
const PDF_MAX_CHARS = 8000;
const SUMMARY_NOTES_MAX_CHARS = 8000;
const SUMMARY_PDF_MAX_CHARS = 20000;

const truncateText = (value, maxChars) => {
  if (!value) return "";
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...`;
};

const toCleanString = (value) => String(value ?? "").trim();

const tryParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

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
  if (!term && !definition) return null;
  return { term: term || "Term", definition: definition || "Definition not clearly stated." };
};

const normalizeSummaryOutput = (output, snapshot) => {
  const raw = output && typeof output === "object" ? output : {};
  const keyConcepts = Array.isArray(raw.keyConcepts) ? raw.keyConcepts.map(toCleanString).filter(Boolean) : [];
  const mainIdeas = Array.isArray(raw.mainIdeas) ? raw.mainIdeas.map(toCleanString).filter(Boolean) : [];
  const importantDefinitions = Array.isArray(raw.importantDefinitions) ? raw.importantDefinitions.map(normalizeDefinitionItem).filter(Boolean) : [];
  const keyTakeaways = Array.isArray(raw.keyTakeaways) ? raw.keyTakeaways.map(toCleanString).filter(Boolean) : [];
  const importantNotes = Array.isArray(raw.importantNotes) ? raw.importantNotes.map(toCleanString).filter(Boolean) : [];
  const summary = toCleanString(raw.summary) || toCleanString(raw.detailedSummary);
  return {
    title: toCleanString(raw.title) || snapshot.moduleTitle || "Study Summary",
    summary: summary || "No summary could be generated.",
    detailedSummary: toCleanString(raw.detailedSummary) || summary || "No detailed summary could be generated.",
    keyConcepts,
    mainIdeas,
    importantDefinitions,
    keyTakeaways,
    importantNotes,
    keyPoints: keyConcepts.length ? keyConcepts : importantNotes.length ? importantNotes : keyTakeaways.length ? keyTakeaways : ["No key concepts were clearly identified."],
    glossary: importantDefinitions.length ? importantDefinitions : [{ term: "None", definition: "None clearly stated in the notes." }],
  };
};

const normalizeKeywordsOutput = (output, snapshot) => {
  const raw = output && typeof output === "object" ? output : {};
  const keywords = Array.isArray(raw.keywords) ? raw.keywords.map(toCleanString).filter(Boolean) : [];
  return {
    title: toCleanString(raw.title) || snapshot.moduleTitle || "Study Keywords",
    keywords: [...new Set(keywords)].slice(0, 12),
  };
};

const normalizeQuizOutput = (output) => {
  const raw = output && typeof output === "object" ? output : {};
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  return {
    questions: questions.map((item) => {
      const type = item?.type === "short" ? "short" : "mcq";
      const question = toCleanString(item?.question);
      const explanation = toCleanString(item?.explanation);
      if (!question) return null;
      if (type === "short") {
        const answer = toCleanString(item?.answer);
        if (!answer) return null;
        return { type, question, answer, explanation };
      }
      const choices = Array.isArray(item?.choices) ? item.choices.map(toCleanString).filter(Boolean).slice(0, 4) : [];
      const answerIndex = Number.isInteger(item?.answerIndex) ? item.answerIndex : 0;
      if (choices.length !== 4 || answerIndex < 0 || answerIndex > 3) return null;
      return { type: "mcq", question, choices, answerIndex, explanation };
    }).filter(Boolean),
  };
};

const normalizeStoredSummaryOutput = (output, snapshot) =>
  normalizeSummaryOutput(output && typeof output === "object" ? output : {}, snapshot);

const inferTopicFromSummary = (summaryOutput, snapshot) => {
  const title = toCleanString(summaryOutput?.title);
  if (title) return title;
  const mainIdea = Array.isArray(summaryOutput?.mainIdeas)
    ? summaryOutput.mainIdeas.map(toCleanString).find(Boolean)
    : "";
  if (mainIdea) return mainIdea;
  const keyConcept = Array.isArray(summaryOutput?.keyConcepts)
    ? summaryOutput.keyConcepts.map(toCleanString).find(Boolean)
    : "";
  if (keyConcept) return keyConcept;
  return snapshot.moduleTitle || "Study Topic";
};

const getSnapshotLimitsForType = (type) =>
  type === "summary"
    ? { notesMaxChars: SUMMARY_NOTES_MAX_CHARS, pdfMaxChars: SUMMARY_PDF_MAX_CHARS }
    : { notesMaxChars: NOTES_MAX_CHARS, pdfMaxChars: PDF_MAX_CHARS };

const buildContextSnapshot = (module, note, links, pdfText, limits = {}) => ({
  moduleTitle: module.title || "",
  notesText: truncateText(note?.content ?? "", limits.notesMaxChars ?? NOTES_MAX_CHARS),
  links: links.map((link) => ({ title: link.title || "", url: link.url || "" })),
  pdfText: truncateText(pdfText, limits.pdfMaxChars ?? PDF_MAX_CHARS),
});

const loadModuleContext = async (req) => {
  const module = await RevisionModule.findOne({ _id: req.params.moduleId, user_id: req.user.id });
  if (!module) return { module: null };

  const [note, links, documents] = await Promise.all([
    ModuleNote.findOne({ module_id: module._id, user_id: req.user.id }),
    ModuleLink.find({ module_id: module._id, user_id: req.user.id }).sort({ created_at: -1 }),
    ModuleDocument.find({ module_id: module._id, user_id: req.user.id }).sort({ uploadedAt: -1 }),
  ]);

  const pdfTextChunks = [];
  let extractedChars = 0;
  let pdfTextIncluded = false;
  let pdfExtractionWarning = false;

  for (const doc of documents) {
    if (doc.mime_type !== "application/pdf") continue;
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

  return {
    module,
    note,
    links,
    rawPdfText: pdfTextChunks.join("\n\n"),
    meta: {
      notesIncluded: Boolean((note?.content || "").trim()),
      pdfTextIncluded,
      extractedChars,
      pdfExtractionWarning,
    },
  };
};

const getLatestOutputsByModule = async (userId, moduleId) => {
  const items = await ModuleAIOutput.find({ userId, moduleId }).sort({ isSaved: -1, createdAt: -1 });
  return items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = {
        cached: true,
        output: item.outputJson,
        createdAt: item.createdAt,
        isSaved: Boolean(item.isSaved),
      };
    }
    return acc;
  }, {});
};

const buildPrompt = (type, snapshot, topicContext = null) => {
  if (type === "summary") {
    return `Return only valid JSON with keys title, summary, detailedSummary, mainIdeas, keyConcepts, importantDefinitions, keyTakeaways, importantNotes, keyPoints, glossary.\nNotes:\n${snapshot.notesText || "N/A"}\n\nPDF text:\n${snapshot.pdfText || "N/A"}`;
  }
  if (type === "keywords") {
    return `Return only valid JSON with keys title and keywords. Provide 8 to 15 relevant keywords.\nNotes:\n${snapshot.notesText || "N/A"}\n\nPDF text:\n${snapshot.pdfText || "N/A"}`;
  }
  return `Return only valid JSON with key questions. Provide 4 to 5 questions; MCQs must have 4 choices. Build the quiz primarily from the summary and inferred topic. Use notes and PDF text only to sharpen accuracy, not to change the main topic. Every question must clearly reflect the summary's main ideas, concepts, or takeaways.\nInferred topic:\n${topicContext?.topic || snapshot.moduleTitle || "Study Topic"}\n\nSummary:\n${topicContext?.summaryText || "N/A"}\n\nNotes:\n${snapshot.notesText || "N/A"}\n\nPDF text:\n${snapshot.pdfText || "N/A"}`;
};

const generateWithOllama = async (type, snapshot, topicContext = null) => {
  let raw = null;
  try {
    raw = await llm.generateText(buildPrompt(type, snapshot, topicContext));
  } catch {
    raw = null;
  }
  const parsed = raw ? tryParseJson(raw) : null;
  if (!parsed) return null;
  if (type === "summary") return normalizeSummaryOutput(parsed, snapshot);
  if (type === "keywords") return normalizeKeywordsOutput(parsed, snapshot);
  const quiz = normalizeQuizOutput(parsed);
  return quiz.questions.length >= 4 && quiz.questions.length <= 5 ? quiz : null;
};

const buildFallback = (type, snapshot, topicContext = null) => {
  if (type === "keywords") {
    const words = [...new Set(`${snapshot.moduleTitle} ${snapshot.notesText} ${snapshot.pdfText}`.split(/[\s,.;:!?()[\]{}"'`]+/).map((x) => x.trim()).filter((x) => x.length >= 4 && x.length <= 24))].slice(0, 10);
    return { title: snapshot.moduleTitle || "Study Keywords", keywords: words };
  }
  if (type === "quiz") {
    const focus = topicContext?.topic || snapshot.moduleTitle || "this module";
    const takeaway =
      toCleanString(topicContext?.summaryOutput?.keyTakeaways?.[0]) ||
      toCleanString(topicContext?.summaryOutput?.mainIdeas?.[0]) ||
      "One central idea from the summary.";
    return {
      questions: [
        { type: "mcq", question: `According to the summary, what is the main focus of ${focus}?`, choices: ["The core topic described in the summary", "An unrelated topic", "Only trivia", "No topic"], answerIndex: 0, explanation: "The quiz should stay aligned with the summary topic." },
        { type: "mcq", question: "Which kind of information should you remember first from the summary?", choices: ["Key concepts and takeaways", "Only formatting details", "Only page count", "Nothing important"], answerIndex: 0, explanation: "The summary should drive the most important revision points." },
        { type: "mcq", question: `Which statement best matches the summary of ${focus}?`, choices: [takeaway, "A random unrelated detail", "A formatting instruction", "No meaningful idea"], answerIndex: 0, explanation: "This option reflects the summary takeaway." },
        { type: "short", question: "State one important takeaway from the summary.", answer: takeaway, explanation: "This checks whether the learner retained a summary-based idea." },
      ],
    };
  }
  return normalizeSummaryOutput({ title: snapshot.moduleTitle, summary: snapshot.pdfText || snapshot.notesText || "No summary available." }, snapshot);
};

const getTopicContext = async (userId, moduleId, summarySnapshot) => {
  const latestSummary = await ModuleAIOutput.findOne({
    userId,
    moduleId,
    type: "summary",
  }).sort({ isSaved: -1, createdAt: -1 });

  const summaryOutput = latestSummary?.outputJson
    ? normalizeStoredSummaryOutput(latestSummary.outputJson, summarySnapshot)
    : await generateWithOllama("summary", summarySnapshot) || buildFallback("summary", summarySnapshot);

  return {
    topic: inferTopicFromSummary(summaryOutput, summarySnapshot),
    summaryText: toCleanString(summaryOutput?.detailedSummary) || toCleanString(summaryOutput?.summary),
    summaryOutput,
  };
};

const handleAiRequest = (type) => async (req, res) => {
  const startedAt = Date.now();
  try {
    logger.info("AI generation started", {
      event: "ai_generation_start",
      feature: type,
      moduleId: req.params.moduleId,
      requestId: req.requestId,
    });
    const { module, note, links, rawPdfText, meta } = await loadModuleContext(req);
    if (!module) return sendError(res, 404, "NOT_FOUND", "Module not found.");
    const snapshot = buildContextSnapshot(module, note, links, rawPdfText, getSnapshotLimitsForType(type));
    const topicContext =
      type === "quiz"
        ? await getTopicContext(
            req.user.id,
            module._id,
            buildContextSnapshot(module, note, links, rawPdfText, getSnapshotLimitsForType("summary"))
          )
        : null;
    let output = await generateWithOllama(type, snapshot, topicContext);
    if (!output) output = buildFallback(type, snapshot, topicContext);
    const created = await ModuleAIOutput.create({
      userId: req.user.id,
      moduleId: module._id,
      type,
      inputSnapshot: snapshot,
      outputJson: output,
    });
    logger.info("AI generation completed", {
      event: "ai_generation_complete",
      feature: type,
      moduleId: module._id.toString(),
      durationMs: Date.now() - startedAt,
      requestId: req.requestId,
    });
    return res.json({ cached: false, output: created.outputJson, createdAt: created.createdAt, meta: type === "summary" ? meta : undefined });
  } catch (error) {
    logger.error("AI generation failed", {
      event: "ai_generation_failed",
      feature: type,
      moduleId: req.params.moduleId,
      durationMs: Date.now() - startedAt,
      requestId: req.requestId,
      stack: error?.stack,
      error: error?.message,
    });
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to generate AI output.");
  }
};

const getModuleAiOutputs = async (req, res) => {
  try {
    const module = await RevisionModule.findOne({ _id: req.params.moduleId, user_id: req.user.id });
    if (!module) return sendError(res, 404, "NOT_FOUND", "Module not found.");
    const outputs = await getLatestOutputsByModule(req.user.id, module._id);
    return res.json({ outputs });
  } catch {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to load AI outputs.");
  }
};

const saveModuleAiOutput = async (req, res) => {
  try {
    const module = await RevisionModule.findOne({ _id: req.params.moduleId, user_id: req.user.id });
    if (!module) return sendError(res, 404, "NOT_FOUND", "Module not found.");
    const { type, output } = req.body || {};
    if (!type || !["summary", "quiz", "resources", "keywords"].includes(type)) return sendError(res, 400, "VALIDATION_ERROR", "Invalid AI output type.");
    if (!output || typeof output !== "object") return sendError(res, 400, "VALIDATION_ERROR", "Output payload is required.");
    await ModuleAIOutput.updateMany({ userId: req.user.id, moduleId: module._id, type }, { $set: { isSaved: false } });
    const created = await ModuleAIOutput.create({
      userId: req.user.id,
      moduleId: module._id,
      type,
      inputSnapshot: { moduleTitle: module.title || "" },
      outputJson: output,
      isSaved: true,
    });
    return res.json({ saved: true, output: created.outputJson, createdAt: created.createdAt, isSaved: true });
  } catch {
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to save AI output.");
  }
};

const generateSummary = handleAiRequest("summary");
const generateQuiz = handleAiRequest("quiz");
const generateResources = handleAiRequest("resources");
const generateKeywords = handleAiRequest("keywords");

export { generateSummary, generateQuiz, generateResources, generateKeywords, getModuleAiOutputs, saveModuleAiOutput };
