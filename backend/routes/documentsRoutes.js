import express from "express";
import { uploadDocument } from "../config/multer.config";
import { getAllDocuments, getDocumentById, updateDocument } from "../controllers/documentsController";
const router = express.Router();

router.post("/upload",uploadDocument.single("document"),uploadDocument)
router.get("/",getAllDocuments)
router.get("/:id",getDocumentById)
router.delete("/:id",deleteDocument)
router.put("/:id",updateDocument)



export default router;
