import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { body, validationResult } from "express-validator";
import Document from "../models/Document.js";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../middleware/upload.js";
const router = express.Router();

const allowedTypes = /pdf|doc|docx|txt/;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "documents",
    resource_type: "raw",
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
  },
});

async function userHasAccess(userId, projectId) {
  const project = await Project.findById(projectId);
  if (!project) return false;

  return (
    project.createdBy.toString() === userId.toString() ||
    project.teamMembers.some(
      (member) => member.user.toString() === userId.toString()
    )
  );
}

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    }).select("_id");

    const projectIds = projects.map((p) => p._id);

    const documents = await Document.find({ projectId: { $in: projectIds } })
      .populate("uploadedBy", "name email")
      .populate("projectId", "title")
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching documents" });
  }
});

router.get("/:id", auth, async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate("uploadedBy", "name email")
    .populate("projectId", "title");

  if (!document) return res.status(404).json({ message: "Document not found" });

  if (!(await userHasAccess(req.user._id, document.projectId)))
    return res.status(403).json({ message: "Access denied" });

  res.json(document);
});
router.post("/upload", upload.single("file"), auth, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { originalname, mimetype, size, path: filePath } = req.file;
    const extension = originalname.split(".").pop().toLowerCase();

    const typeMapping = {
      pdf: "report",
      doc: "report",
      docx: "report",
      txt: "other",
    };

    const document = new Document({
      fileName: originalname,
      title: originalname,
      type: typeMapping[extension] || "other",
      fileSize: size,
      filePath,
      mimeType: mimetype,
      uploadedBy: req.user._id,
      projectId: req.body.projectId,
      version: 1,
    });

    await document.save();
    await document.populate("uploadedBy", "name email");

    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ message: "Server error while uploading document" });
  }
});

router.get("/:id/download", auth, async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) return res.status(404).json({ message: "Document not found" });

  if (!(await userHasAccess(req.user._id, document.projectId)))
    return res.status(403).json({ message: "Access denied" });

  res.redirect(document.filePath);
});

router.patch(
  "/:id",
  auth,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be less than 200 characters"),
    body("content")
      .optional()
      .isLength({ max: 50000 })
      .withMessage("Content is too long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const document = await Document.findById(req.params.id);
    if (!document)
      return res.status(404).json({ message: "Document not found" });

    if (!(await userHasAccess(req.user._id, document.projectId)))
      return res.status(403).json({ message: "Access denied" });

    if (req.body.title !== undefined) document.title = req.body.title;
    if (req.body.content !== undefined) {
      document.content = req.body.content;
      document.version += 1;
    }

    await document.save();
    res.json(document);
  }
);

router.delete("/:id", auth, async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) return res.status(404).json({ message: "Document not found" });

  if (!(await userHasAccess(req.user._id, document.projectId)))
    return res.status(403).json({ message: "Access denied" });

  const publicId = document.filePath.split("/").slice(-1)[0].split(".")[0];

  await cloudinary.uploader.destroy(`documents/${publicId}`, {
    resource_type: "raw",
  });

  await document.deleteOne();

  res.json({ message: "Document deleted successfully" });
});

export default router;
