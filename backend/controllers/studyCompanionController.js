import fs from "fs";
import path from "path";
import ModuleDocument from "../models/ModuleDocument.js";
import RevisionModule from "../models/RevisionModule.js";
import { sendError } from "../utils/errors.js";
import { processDocumentForAi } from "../services/documentIngestionService.js";
import { answerQuestionWithDocument } from "../services/chatService.js";
import {
  generateQuizForDocument,
  submitQuizAttempt,
} from "../services/quizService.js";
import {
  getDailyRecommendations,
  updateWeakTopicsFromAttempt,
} from "../services/recommendationService.js";

const ensureStudyUploadsDir = () => {
  const uploadDir = path.resolve("uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const uploadAndProcessDocument = async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, "VALIDATION_ERROR", "PDF file is required.");
  }

  const isPdf =
    req.file.mimetype === "application/pdf" ||
    path.extname(req.file.originalname || "").toLowerCase() === ".pdf";

  if (!isPdf) {
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return sendError(res, 400, "VALIDATION_ERROR", "Only PDF uploads are supported.");
  }

  const module = await RevisionModule.findOne({
    _id: req.params.moduleId,
    user_id: req.user.id,
  }).lean();

  if (!module) {
    return sendError(res, 404, "NOT_FOUND", "Module not found.");
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const document = await ModuleDocument.create({
    module_id: module._id,
    user_id: req.user.id,
    originalName: req.file.originalname,
    filename: req.file.filename,
    mime_type: req.file.mimetype,
    size: req.file.size,
    url: `${baseUrl}/uploads/${req.file.filename}`,
    uploadedAt: new Date(),
    aiEmbeddingStatus: "processing",
    aiLastProcessedAt: new Date(),
  });

  const processing = await processDocumentForAi({ document });
  const freshDocument = await ModuleDocument.findById(document._id).lean();

  return res.status(201).json({
    message: "Document uploaded and indexed successfully.",
    document: freshDocument,
    processing,
  });
};

const reindexDocument = async (req, res) => {
  const document = await ModuleDocument.findOne({
    _id: req.params.documentId,
    user_id: req.user.id,
  });

  if (!document) {
    return sendError(res, 404, "NOT_FOUND", "Document not found.");
  }

  const processing = await processDocumentForAi({ document });
  const freshDocument = await ModuleDocument.findById(document._id).lean();

  return res.json({
    message: "Document reindexed successfully.",
    document: freshDocument,
    processing,
  });
};

const chatWithDocument = async (req, res) => {
  const mode = req.query.mode || "detailed";
  const { documentId, question } = req.body;

  const result = await answerQuestionWithDocument({
    userId: req.user.id,
    documentId,
    question,
    mode,
  });

  return res.json({
    message: "Answer generated successfully.",
    answer: result.answer,
    sources: result.sources,
    chat: result.chat,
  });
};

const generateQuiz = async (req, res) => {
  const { documentId, topic } = req.body;
  const { quiz } = await generateQuizForDocument({
    userId: req.user.id,
    documentId,
    topic,
  });

  return res.status(201).json({
    message: "Quiz generated successfully.",
    quiz,
  });
};

const submitQuiz = async (req, res) => {
  const { quizId, answers, timeSpentSeconds } = req.body;
  const result = await submitQuizAttempt({
    userId: req.user.id,
    quizId,
    answers,
    timeSpentSeconds,
  });

  await updateWeakTopicsFromAttempt({
    quiz: result.quiz,
    attempt: result.attempt,
  });

  return res.json({
    message: "Quiz submitted successfully.",
    score: result.score,
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    wrongAnswers: result.wrongAnswers,
    attempt: result.attempt,
  });
};

const getRecommendations = async (req, res) => {
  const recommendations = await getDailyRecommendations({ userId: req.user.id });
  return res.json({ recommendations });
};

export {
  ensureStudyUploadsDir,
  uploadAndProcessDocument,
  reindexDocument,
  chatWithDocument,
  generateQuiz,
  submitQuiz,
  getRecommendations,
};
