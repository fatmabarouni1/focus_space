import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id format.");

const email = z.string().email("Invalid email.");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");
const role = z.enum(["user", "admin"]);

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
});

const dateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date.");

const authSchemas = {
  register: z.object({
    name: z.string().min(1).max(80),
    email,
    password,
  }),
  registerInitiate: z.object({
    name: z.string().min(1).max(80),
    email,
    password,
    method: z.enum(["email", "sms"]),
    phone: z.string().trim().optional(),
  }),
  registerVerify: z.object({
    email: email.optional(),
    phone: z.string().trim().optional(),
    method: z.enum(["email", "sms"]),
    otp: z.string().regex(/^\d{6}$/).optional(),
    code: z.string().regex(/^\d{6}$/).optional(),
  }).superRefine((data, ctx) => {
    if (!data.otp && !data.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otp"],
        message: "Verification code is required.",
      });
    }
  }).transform((data) => ({
    ...data,
    otp: data.otp ?? data.code,
  })),
  login: z.object({
    email,
    password,
  }),
  passwordResetRequest: z.object({
    email: email.optional(),
    phone: z.string().trim().optional(),
    method: z.enum(["email", "sms"]),
  }),
  passwordResetVerify: z.object({
    email: email.optional(),
    phone: z.string().trim().optional(),
    method: z.enum(["email", "sms"]),
    otp: z.string().regex(/^\d{6}$/).optional(),
    code: z.string().regex(/^\d{6}$/).optional(),
    newPassword: password,
  }).superRefine((data, ctx) => {
    if (!data.otp && !data.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otp"],
        message: "Verification code is required.",
      });
    }
  }).transform((data) => ({
    ...data,
    otp: data.otp ?? data.code,
  })),
};

const adminSchemas = {
  listUsersQuery: paginationQuery,
  updateRoleParams: z.object({ id: objectId }),
  updateRoleBody: z.object({ role }),
};

const noteSchemas = {
  createBody: z.object({
    title: z.string().max(120).optional(),
    content: z.string().min(1),
    ai_generated: z.boolean().optional(),
  }),
  updateBody: z
    .object({
      title: z.string().max(120).optional(),
      content: z.string().optional(),
      ai_generated: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No updates provided.",
    }),
  noteIdParams: z.object({ noteId: objectId }),
};

const goalSchemas = {
  createBody: z.object({
    title: z.string().min(1).max(120),
    description: z.string().optional(),
    target: z.coerce.number(),
    unit: z.string().min(1).max(40),
    deadline: dateString.optional(),
    current: z.coerce.number().optional(),
  }),
  updateBody: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().optional(),
      target: z.coerce.number().optional(),
      unit: z.string().max(40).optional(),
      deadline: dateString.optional(),
      current: z.coerce.number().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No updates provided.",
    }),
  goalIdParams: z.object({ goalId: objectId }),
};

const eventSchemas = {
  createBody: z.object({
    title: z.string().min(1).max(120),
    description: z.string().optional(),
    date: dateString,
    time: z.string().optional(),
    type: z.enum(["session", "deadline", "task"]),
    duration: z.coerce.number().optional(),
    completed: z.boolean().optional(),
  }),
  updateBody: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().optional(),
      date: dateString.optional(),
      time: z.string().optional(),
      type: z.enum(["session", "deadline", "task"]).optional(),
      duration: z.coerce.number().optional(),
      completed: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No updates provided.",
    }),
  eventIdParams: z.object({ eventId: objectId }),
};

const roomSchemas = {
  createBody: z.object({
    title: z.string().min(3).max(60),
  }),
  roomIdParams: z.object({ roomId: objectId }),
};

const moduleSchemas = {
  moduleIdParams: z.object({ moduleId: objectId }),
  documentIdParams: z.object({ documentId: objectId }),
  linkIdParams: z.object({ linkId: objectId }),
  createModuleBody: z.object({
    title: z.string().min(1).max(120),
    description: z.string().optional(),
  }),
  updateModuleBody: z
    .object({
      title: z.string().min(1).max(120).optional(),
      description: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No updates provided.",
    }),
  saveNoteBody: z.object({
    content: z.string().optional(),
  }),
  createLinkBody: z.object({
    title: z.string().min(1).max(120),
    url: z.string().url(),
  }),
};

const aiSchemas = {
  moduleIdParams: z.object({ moduleId: objectId }),
};

const studyCompanionSchemas = {
  moduleIdParams: z.object({ moduleId: objectId }),
  documentIdParams: z.object({ documentId: objectId }),
  chatQuery: z.object({
    mode: z.enum(["simple", "detailed", "example"]).optional(),
  }),
  chatBody: z.object({
    documentId: objectId,
    question: z.string().trim().min(3).max(4000),
  }),
  generateQuizBody: z.object({
    documentId: objectId,
    topic: z.string().trim().min(2).max(120).optional(),
  }),
  submitQuizBody: z.object({
    quizId: objectId,
    answers: z.array(z.string()).default([]),
    timeSpentSeconds: z.coerce.number().int().min(0).optional(),
  }),
};

const timerSchemas = {
  createBody: z.object({
    focus_duration: z.coerce.number().int().min(1),
    break_duration: z.coerce.number().int().min(1),
    mode: z.enum(["pomodoro", "50-10", "custom"]),
  }),
};

const dashboardSchemas = {
  updateTargetsBody: z
    .object({
      dailySessionsTarget: z.coerce.number().int().min(1).optional(),
      weeklySessionsTarget: z.coerce.number().int().min(1).optional(),
      dailyFocusMinutesTarget: z.coerce.number().int().min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No updates provided.",
    }),
};

const studySessionSchemas = {
  createBody: z.object({
    title: z.string().min(1).max(120),
    type: z.enum(["solo", "group"]),
    start_time: dateString.optional(),
    end_time: dateString.optional(),
  }),
  completeBody: z.object({
    title: z.string().optional(),
    duration_minutes: z.coerce.number().min(1),
    completed_at: dateString.optional(),
    start_time: dateString.optional(),
  }),
  sessionIdParams: z.object({ sessionId: objectId }),
};

const musicSchemas = {
  setPreferenceBody: z.object({
    platform: z.enum(["spotify", "youtube"]),
    track_url: z.string().url(),
    shared: z.boolean().optional(),
  }),
};

const courseSuggestionSchemas = {
  createBody: z.object({
    title: z.string().min(1).max(120),
    description: z.string().optional(),
    level: z.string().optional(),
  }),
};

const suggestionSchemas = {
  listQuery: z.object({
    moduleId: objectId.optional(),
  }),
  createBody: z.object({
    title: z.string().min(1).max(120),
    description: z.string().optional(),
    level: z.string().optional(),
    moduleId: objectId.optional(),
    source: z.enum(["ai", "manual"]).optional(),
  }),
  deleteParams: z.object({ id: objectId }),
};

export {
  objectId,
  authSchemas,
  adminSchemas,
  noteSchemas,
  goalSchemas,
  eventSchemas,
  roomSchemas,
  moduleSchemas,
  aiSchemas,
  studyCompanionSchemas,
  timerSchemas,
  dashboardSchemas,
  studySessionSchemas,
  musicSchemas,
  courseSuggestionSchemas,
  suggestionSchemas,
  paginationQuery,
};
