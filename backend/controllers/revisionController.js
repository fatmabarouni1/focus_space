import fs from "fs";
import path from "path";
import RevisionModule from "../models/RevisionModule.js";
import ModuleDocument from "../models/ModuleDocument.js";
import ModuleNote from "../models/ModuleNote.js";
import ModuleLink from "../models/ModuleLink.js";
import ModuleResourceSuggestion from "../models/ModuleResourceSuggestion.js";
import { withOwner } from "../utils/ownership.js";
import { sendError } from "../utils/errors.js";
import { paginateCursor } from "../utils/paginate.js";
import { extractPdfText } from "../utils/pdfText.js";
import logger from "../utils/logger.js";

const ensureUploadsDir = () => {
  const uploadDir = path.resolve("uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

// Modules
const listModules = async (req, res) => {
  const result = await paginateCursor({
    model: RevisionModule,
    filter: { user_id: req.user.id },
    limit: req.pagination?.limit,
    cursor: req.pagination?.cursor,
    sortField: "created_at",
    sortOrder: -1,
  });

  return res.json(result);
};

const createModule = async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return sendError(res, 400, "VALIDATION_ERROR", "Title is required.");
  }

  const module = await RevisionModule.create({
    user_id: req.user.id,
    title: title.trim(),
    description: description?.trim() || "",
  });

  return res.status(201).json({ message: "Module created.", module });
};

const getModule = async (req, res) => {
  const module = await RevisionModule.findOne({
    _id: req.params.moduleId,
    user_id: req.user.id,
  });

  if (!module) {
    return sendError(res, 404, "NOT_FOUND", "Module not found.");
  }

  return res.json({ module });
};

const updateModule = async (req, res) => {
  const { title, description } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  updates.updated_at = new Date();

  const module = await RevisionModule.findOneAndUpdate(
    withOwner(req, { _id: req.params.moduleId }),
    updates,
    { new: true }
  );

  if (!module) {
    return sendError(res, 404, "NOT_FOUND", "Module not found.");
  }

  return res.json({ message: "Module updated.", module });
};

const deleteModule = async (req, res) => {
  const module = await RevisionModule.findOneAndDelete(
    withOwner(req, { _id: req.params.moduleId })
  );

  if (!module) {
    return sendError(res, 404, "NOT_FOUND", "Module not found.");
  }

  const relatedFilter =
    req.user?.role === "admin"
      ? { module_id: module._id }
      : { module_id: module._id, user_id: req.user.id };
  await ModuleDocument.deleteMany(relatedFilter);
  await ModuleNote.deleteMany(relatedFilter);
  await ModuleLink.deleteMany(relatedFilter);

  return res.json({ message: "Module deleted." });
};

// Documents
const listDocuments = async (req, res) => {
  const result = await paginateCursor({
    model: ModuleDocument,
    filter: {
      module_id: req.params.moduleId,
      user_id: req.user.id,
    },
    limit: req.pagination?.limit,
    cursor: req.pagination?.cursor,
    sortField: "uploadedAt",
    sortOrder: -1,
    transform: (doc) => ({
      ...doc,
      originalName: doc.originalName ?? doc.original_name,
      uploadedAt: doc.uploadedAt ?? doc.created_at,
    }),
  });

  return res.json(result);
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, "VALIDATION_ERROR", "File is required.");
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    let extractedText = "";
    let extractedChars = 0;
    let extractionError = null;
    let extractedAt = null;

    if (req.file.mimetype === "application/pdf") {
      const filePath = req.file.path || path.resolve("uploads", req.file.filename);
      const extracted = await extractPdfText(filePath);
      extractedText = extracted.text;
      extractedChars = extracted.chars;
      extractionError = extracted.error;
      extractedAt = new Date();
    }

    const document = await ModuleDocument.create({
      module_id: req.params.moduleId,
      user_id: req.user.id,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mime_type: req.file.mimetype,
      size: req.file.size,
      url: `${baseUrl}/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
      extractedText,
      extractedChars,
      extractedAt,
      extractionError,
    });

    await RevisionModule.updateOne(
      withOwner(req, { _id: req.params.moduleId }),
      { updated_at: new Date() }
    );

    logger.info("Document upload succeeded", {
      event: "upload_success",
      moduleId: req.params.moduleId,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      requestId: req.requestId,
    });

    return res.status(201).json({ message: "Document uploaded.", document });
  } catch (error) {
    logger.error("Document upload failed", {
      event: "upload_failed",
      moduleId: req.params.moduleId,
      fileSize: req.file?.size ?? null,
      mimeType: req.file?.mimetype ?? null,
      requestId: req.requestId,
      stack: error?.stack,
      error: error?.message,
    });
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to upload document.");
  }
};

const deleteDocument = async (req, res) => {
  const document = await ModuleDocument.findOneAndDelete(
    withOwner(req, { _id: req.params.documentId })
  );

  if (!document) {
    return sendError(res, 404, "NOT_FOUND", "Document not found.");
  }

  await RevisionModule.updateOne(
    withOwner(req, { _id: document.module_id }),
    { updated_at: new Date() }
  );

  return res.json({ message: "Document deleted." });
};

// Notes
const getNote = async (req, res) => {
  const result = await paginateCursor({
    model: ModuleNote,
    filter: {
      module_id: req.params.moduleId,
      user_id: req.user.id,
    },
    limit: req.pagination?.limit,
    cursor: req.pagination?.cursor,
    sortField: "updated_at",
    sortOrder: -1,
  });

  return res.json(result);
};

const saveNote = async (req, res) => {
  const { content } = req.body;

  const note = await ModuleNote.findOneAndUpdate(
    withOwner(req, { module_id: req.params.moduleId }),
    { content: content ?? "", updated_at: new Date() },
    { new: true, upsert: true }
  );

  await RevisionModule.updateOne(
    withOwner(req, { _id: req.params.moduleId }),
    { updated_at: new Date() }
  );

  return res.json({ message: "Note saved.", note });
};

// Links
const listLinks = async (req, res) => {
  const links = await ModuleLink.find({
    module_id: req.params.moduleId,
    user_id: req.user.id,
  }).sort({ created_at: -1 });
  return res.json({ links });
};

const createLink = async (req, res) => {
  const { title, url } = req.body;

  if (!title || !url) {
    return sendError(res, 400, "VALIDATION_ERROR", "Title and url are required.");
  }

  const link = await ModuleLink.create({
    module_id: req.params.moduleId,
    user_id: req.user.id,
    title: title.trim(),
    url: url.trim(),
  });

  await RevisionModule.updateOne(
    withOwner(req, { _id: req.params.moduleId }),
    { updated_at: new Date() }
  );

  return res.status(201).json({ message: "Link added.", link });
};

const deleteLink = async (req, res) => {
  const link = await ModuleLink.findOneAndDelete(
    withOwner(req, { _id: req.params.linkId })
  );

  if (!link) {
    return sendError(res, 404, "NOT_FOUND", "Link not found.");
  }

  await RevisionModule.updateOne(
    withOwner(req, { _id: link.module_id }),
    { updated_at: new Date() }
  );

  return res.json({ message: "Link deleted." });
};

const listResources = async (req, res) => {
  const result = await paginateCursor({
    model: ModuleResourceSuggestion,
    filter: {
      moduleId: req.params.moduleId,
      userId: req.user.id,
    },
    limit: req.pagination?.limit,
    cursor: req.pagination?.cursor,
    sortField: "createdAt",
    sortOrder: -1,
  });

  return res.json(result);
};

export {
  ensureUploadsDir,
  listModules,
  createModule,
  getModule,
  updateModule,
  deleteModule,
  listDocuments,
  uploadDocument,
  deleteDocument,
  getNote,
  saveNote,
  listResources,
  listLinks,
  createLink,
  deleteLink,
};
