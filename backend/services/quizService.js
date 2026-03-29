import ModuleDocument from "../models/ModuleDocument.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { llm } from "./llm.js";
import { retrieveRelevantChunks } from "./retrievalService.js";
import { ApiError } from "../utils/errors.js";

const safeParseQuizJson = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new ApiError(502, "QUIZ_JSON_INVALID", "AI returned invalid quiz JSON.");
  }
};

const generateQuizForDocument = async ({ userId, documentId, topic }) => {
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
      "Document is not indexed for quiz generation yet."
    );
  }

  const retrievalQuery = topic
    ? `Find the most relevant material about ${topic}`
    : `Find the most important concepts in ${document.originalName}`;
  const chunks = await retrieveRelevantChunks({
    userId,
    documentId,
    question: retrievalQuery,
    limit: 5,
  });

  if (chunks.length === 0) {
    throw new ApiError(404, "NO_CONTEXT_FOUND", "No relevant chunks found for quiz generation.");
  }

  const context = chunks
    .map((chunk) => `Chunk ${chunk.chunkIndex}:\n${chunk.text}`)
    .join("\n\n");

  const content = await llm.generateText(
    `Create a revision quiz${topic ? ` about ${topic}` : ""} from the context below.\n\n${context}`,
    [
      "You generate study quizzes strictly in JSON.",
      "Base every question only on the provided context.",
      'Return exactly this object shape: {"questions":[{"type":"mcq","question":"...","options":["...","...","...","..."],"correctAnswer":"...","explanation":"...","topic":"...","difficulty":"easy|medium|hard"}]}',
      "Always return between 3 and 6 questions.",
      "Return only valid JSON with no markdown fences.",
    ].join(" ")
  );

  if (!content) {
    throw new ApiError(502, "OLLAMA_EMPTY_RESPONSE", "Ollama returned an empty quiz.");
  }

  const parsed = safeParseQuizJson(content);
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new ApiError(502, "QUIZ_JSON_INVALID", "AI returned no questions.");
  }

  const quiz = await Quiz.create({
    userId,
    moduleId: document.module_id,
    documentId: document._id,
    topic: topic || null,
    sourceChunkIds: chunks.map((chunk) => chunk._id),
    questions: parsed.questions,
  });

  return { quiz };
};

const submitQuizAttempt = async ({
  userId,
  quizId,
  answers,
  timeSpentSeconds = null,
}) => {
  const quiz = await Quiz.findOne({ _id: quizId, userId }).lean();
  if (!quiz) {
    throw new ApiError(404, "NOT_FOUND", "Quiz not found.");
  }

  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  const wrongAnswers = [];
  let correctCount = 0;

  quiz.questions.forEach((question, index) => {
    const userAnswer = String(normalizedAnswers[index] ?? "").trim();
    const correctAnswer = String(question.correctAnswer ?? "").trim();

    if (userAnswer === correctAnswer) {
      correctCount += 1;
      return;
    }

    wrongAnswers.push({
      questionIndex: index,
      question: question.question,
      userAnswer,
      correctAnswer,
      topic: question.topic || "General",
      difficulty: question.difficulty || "medium",
    });
  });

  const totalQuestions = quiz.questions.length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  const attempt = await QuizAttempt.create({
    userId,
    moduleId: quiz.moduleId,
    documentId: quiz.documentId,
    quizId: quiz._id,
    totalQuestions,
    correctCount,
    score,
    wrongAnswers,
    submittedAnswers: normalizedAnswers.map((answer) => String(answer ?? "")),
    timeSpentSeconds,
  });

  return { quiz, attempt, wrongAnswers, score, correctCount, totalQuestions };
};

export { generateQuizForDocument, submitQuizAttempt };
