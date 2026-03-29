import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import User from "../models/User.js";
import RevisionModule from "../models/RevisionModule.js";
import ModuleNote from "../models/ModuleNote.js";
import ModuleDocument from "../models/ModuleDocument.js";
import ModuleLink from "../models/ModuleLink.js";
import ModuleAIOutput from "../models/ModuleAIOutput.js";
import ModuleResourceSuggestion from "../models/ModuleResourceSuggestion.js";
import StudySession from "../models/StudySession.js";
import Goal from "../models/Goal.js";
import Room from "../models/Room.js";
import RoomParticipant from "../models/RoomParticipant.js";
import RefreshToken from "../models/RefreshToken.js";

const indexDefinitions = [
  {
    model: User,
    collection: "users",
    indexes: [
      { keys: { email: 1 }, options: { name: "email_unique", unique: true, background: true } },
      { keys: { phone: 1 }, options: { name: "phone_unique_sparse", unique: true, sparse: true, background: true } },
    ],
  },
  {
    model: RevisionModule,
    collection: "modules",
    indexes: [
      // user_id first because the app fetches "all modules for one user" constantly.
      // updated_at second so MongoDB can return that user's modules in recent-first order.
      { keys: { user_id: 1, updated_at: -1 }, options: { name: "user_updated_at", background: true } },
    ],
  },
  {
    model: ModuleNote,
    collection: "notes",
    indexes: [
      { keys: { module_id: 1 }, options: { name: "module_id", background: true } },
      // user_id first narrows to one owner immediately; module_id second pinpoints the note inside that user's workspace.
      { keys: { user_id: 1, module_id: 1 }, options: { name: "user_module_unique", unique: true, background: true } },
    ],
  },
  {
    model: ModuleDocument,
    collection: "documents",
    indexes: [
      { keys: { user_id: 1 }, options: { name: "user_id", background: true } },
      { keys: { module_id: 1, uploadedAt: -1 }, options: { name: "module_uploaded_at", background: true } },
      // user_id first matches the ownership filter used on every document query; module_id refines within that user.
      { keys: { user_id: 1, module_id: 1, uploadedAt: -1 }, options: { name: "user_module_uploaded_at", background: true } },
    ],
  },
  {
    model: ModuleLink,
    collection: "links",
    indexes: [
      { keys: { module_id: 1, created_at: -1 }, options: { name: "module_created_at", background: true } },
      // user_id first mirrors the ownership check used by the controllers before module_id narrows to one module.
      { keys: { user_id: 1, module_id: 1, created_at: -1 }, options: { name: "user_module_created_at", background: true } },
    ],
  },
  {
    model: ModuleAIOutput,
    collection: "aiResults",
    indexes: [
      { keys: { moduleId: 1, createdAt: -1 }, options: { name: "module_created_at", background: true } },
      // userId first matches "my module outputs", then moduleId and type reduce to one AI bucket.
      { keys: { userId: 1, moduleId: 1, type: 1, createdAt: -1 }, options: { name: "user_module_type_created_at", background: true } },
      // userId -> moduleId -> type keeps filtering selective before isSaved and createdAt choose the preferred saved/latest document.
      { keys: { userId: 1, moduleId: 1, type: 1, isSaved: -1, createdAt: -1 }, options: { name: "user_module_type_saved_created_at", background: true } },
    ],
  },
  {
    model: ModuleResourceSuggestion,
    collection: "resources",
    indexes: [
      { keys: { moduleId: 1, createdAt: -1 }, options: { name: "module_created_at", background: true } },
      // userId first matches ownership-scoped reads; moduleId second groups saved resources inside one module.
      { keys: { userId: 1, moduleId: 1, createdAt: -1 }, options: { name: "user_module_created_at", background: true } },
    ],
  },
  {
    model: StudySession,
    collection: "sessions",
    indexes: [
      // created_by first because every dashboard/session query starts from a single user;
      // start_time descending lets MongoDB satisfy recent-first history without extra sorting.
      { keys: { created_by: 1, start_time: -1 }, options: { name: "user_start_time_desc", background: true } },
      // created_by before status is important because the app filters one user's completed sessions, not all completed sessions globally.
      { keys: { created_by: 1, status: 1, completed_at: -1 }, options: { name: "user_status_completed_at_desc", background: true } },
    ],
  },
  {
    model: Goal,
    collection: "goals",
    indexes: [
      { keys: { user_id: 1, created_at: -1 }, options: { name: "user_created_at_desc", background: true } },
      // user_id first keeps goal lookups tenant-scoped; status second supports user-specific status filtering.
      { keys: { user_id: 1, status: 1 }, options: { name: "user_status", background: true } },
    ],
  },
  {
    model: Room,
    collection: "rooms",
    indexes: [
      // host_user_id is the actual "createdBy" field in this codebase.
      { keys: { host_user_id: 1, createdAt: -1 }, options: { name: "host_created_at_desc", background: true } },
    ],
  },
  {
    model: RoomParticipant,
    collection: "roomParticipants",
    indexes: [
      // This codebase stores room membership in RoomParticipant rather than a members array on Room.
      { keys: { user_id: 1, joined_at: -1 }, options: { name: "user_joined_at_desc", background: true } },
      { keys: { room_id: 1, joined_at: -1 }, options: { name: "room_joined_at_desc", background: true } },
      { keys: { room_id: 1, user_id: 1 }, options: { name: "room_user_unique", unique: true, background: true } },
    ],
  },
  {
    model: RefreshToken,
    collection: "refreshTokens",
    indexes: [
      { keys: { tokenHash: 1 }, options: { name: "token_hash_unique", unique: true, background: true } },
      { keys: { userId: 1, createdAt: -1 }, options: { name: "user_created_at_desc", background: true } },
      { keys: { expiresAt: 1 }, options: { name: "expires_at_ttl", expireAfterSeconds: 0, background: true } },
    ],
  },
];

const createIndexes = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB");

  for (const definition of indexDefinitions) {
    for (const index of definition.indexes) {
      await definition.model.collection.createIndex(index.keys, index.options);
      console.log(
        `[INDEX] ${definition.collection}: ${index.options.name} ${JSON.stringify(index.keys)}`
      );
    }
  }
};

createIndexes()
  .then(async () => {
    console.log("Index creation complete.");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  })
  .catch(async (error) => {
    console.error("Failed to create indexes:", error);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
