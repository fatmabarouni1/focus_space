import Quiz from "../models/Quiz.js";
import WeakTopic from "../models/WeakTopic.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const updateWeakTopicsFromAttempt = async ({ quiz, attempt }) => {
  const wrongByTopic = new Map();

  attempt.wrongAnswers.forEach((item) => {
    const topic = item.topic || "General";
    wrongByTopic.set(topic, (wrongByTopic.get(topic) || 0) + 1);
  });

  const touchedTopics = new Set(
    quiz.questions.map((question) => question.topic || "General")
  );

  const now = new Date();

  for (const topic of touchedTopics) {
    const mistakesForTopic = wrongByTopic.get(topic) || 0;
    const totalTopicQuestions = quiz.questions.filter(
      (question) => (question.topic || "General") === topic
    ).length;
    const topicScore =
      totalTopicQuestions === 0
        ? 0
        : Math.round(((totalTopicQuestions - mistakesForTopic) / totalTopicQuestions) * 100);

    const existing = await WeakTopic.findOne({
      userId: attempt.userId,
      moduleId: attempt.moduleId,
      documentId: attempt.documentId,
      topic,
    });

    const attemptsCount = (existing?.attemptsCount || 0) + 1;
    const mistakesCount = (existing?.mistakesCount || 0) + mistakesForTopic;
    const averageScore = existing
      ? Math.round(((existing.averageScore * existing.attemptsCount) + topicScore) / attemptsCount)
      : topicScore;

    const daysSinceReview = existing?.lastReviewedAt
      ? Math.max(0, (now - existing.lastReviewedAt) / (1000 * 60 * 60 * 24))
      : 7;

    const weaknessScore = clamp(
      Math.round(
        (100 - averageScore) * 0.55 +
          mistakesCount * 6 +
          mistakesForTopic * 12 +
          Math.min(daysSinceReview, 14) * 2
      ),
      0,
      100
    );

    await WeakTopic.findOneAndUpdate(
      {
        userId: attempt.userId,
        moduleId: attempt.moduleId,
        documentId: attempt.documentId,
        topic,
      },
      {
        $set: {
          weaknessScore,
          attemptsCount,
          mistakesCount,
          averageScore,
          lastQuizScore: topicScore,
          lastAttemptAt: now,
          nextRecommendedAt: now,
          updatedAt: now,
          ...(mistakesForTopic === 0 ? { lastReviewedAt: now } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const getDailyRecommendations = async ({ userId, limit = 5 }) => {
  const weakTopics = await WeakTopic.find({ userId })
    .sort({ weaknessScore: -1, updatedAt: -1 })
    .limit(limit)
    .lean();

  const quizzes = await Promise.all(
    weakTopics.map((topic) =>
      Quiz.findOne({
        userId,
        documentId: topic.documentId,
        topic: topic.topic,
      })
        .sort({ createdAt: -1 })
        .lean()
    )
  );

  return weakTopics.map((topic, index) => ({
    topic: topic.topic,
    weaknessScore: topic.weaknessScore,
    attemptsCount: topic.attemptsCount,
    mistakesCount: topic.mistakesCount,
    averageScore: topic.averageScore,
    suggestion: `Revise ${topic.topic} and retake a short quiz.`,
    recommendedQuizId: quizzes[index]?._id || null,
    documentId: topic.documentId,
    moduleId: topic.moduleId,
  }));
};

export { updateWeakTopicsFromAttempt, getDailyRecommendations };
