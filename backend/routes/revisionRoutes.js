import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware.js";
import paginateMiddleware from "../middleware/paginateMiddleware.js";
import validate from "../middleware/validate.js";
import {
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
  listResources,
  saveNote,
  listLinks,
  createLink,
  deleteLink,
} from "../controllers/revisionController.js";
import { moduleSchemas } from "../validators/index.js";

ensureUploadsDir();

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.get("/modules", authMiddleware, paginateMiddleware("cursor"), listModules);
router.post(
  "/modules",
  authMiddleware,
  validate({ body: moduleSchemas.createModuleBody }),
  createModule
);
router.get(
  "/modules/:moduleId",
  authMiddleware,
  validate({ params: moduleSchemas.moduleIdParams }),
  getModule
);
router.patch(
  "/modules/:moduleId",
  authMiddleware,
  validate({
    params: moduleSchemas.moduleIdParams,
    body: moduleSchemas.updateModuleBody,
  }),
  updateModule
);
router.delete(
  "/modules/:moduleId",
  authMiddleware,
  validate({ params: moduleSchemas.moduleIdParams }),
  deleteModule
);

router.get(
  "/modules/:moduleId/documents",
  authMiddleware,
  paginateMiddleware("cursor"),
  validate({ params: moduleSchemas.moduleIdParams }),
  listDocuments
);
router.post(
  "/modules/:moduleId/documents",
  authMiddleware,
  validate({ params: moduleSchemas.moduleIdParams }),
  upload.single("file"),
  uploadDocument
);
router.delete(
  "/documents/:documentId",
  authMiddleware,
  validate({ params: moduleSchemas.documentIdParams }),
  deleteDocument
);

router.get(
  "/modules/:moduleId/notes",
  authMiddleware,
  paginateMiddleware("cursor"),
  validate({ params: moduleSchemas.moduleIdParams }),
  getNote
);
router.get(
  "/modules/:moduleId/resources",
  authMiddleware,
  paginateMiddleware("cursor"),
  validate({ params: moduleSchemas.moduleIdParams }),
  listResources
);
router.put(
  "/modules/:moduleId/notes",
  authMiddleware,
  validate({
    params: moduleSchemas.moduleIdParams,
    body: moduleSchemas.saveNoteBody,
  }),
  saveNote
);

router.get(
  "/modules/:moduleId/links",
  authMiddleware,
  validate({ params: moduleSchemas.moduleIdParams }),
  listLinks
);
router.post(
  "/modules/:moduleId/links",
  authMiddleware,
  validate({
    params: moduleSchemas.moduleIdParams,
    body: moduleSchemas.createLinkBody,
  }),
  createLink
);
router.delete(
  "/links/:linkId",
  authMiddleware,
  validate({ params: moduleSchemas.linkIdParams }),
  deleteLink
);

export default router;
