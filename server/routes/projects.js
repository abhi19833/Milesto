import express from "express";
import { body, validationResult } from "express-validator";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Document from "../models/Document.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    })
      .populate("createdBy", "name email")
      .populate("teamMembers.user", "name email")
      .sort({ createdAt: -1 });

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ projectId: project._id });
        const documentCount = await Document.countDocuments({
          projectId: project._id,
        });
        const completedTasks = await Task.countDocuments({
          projectId: project._id,
          status: "completed",
        });

        const progress =
          taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

        return {
          ...project.toObject(),
          taskCount,
          documentCount,
          progress,
        };
      })
    );

    res.json(projectsWithStats);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("teamMembers.user", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const hasAccess =
      project.createdBy._id.toString() === req.user._id.toString() ||
      project.teamMembers.some(
        (m) => m.user._id.toString() === req.user._id.toString()
      );

    if (!hasAccess) {
      return res.status(403).json({ message: "You don’t have access" });
    }

    const taskCount = await Task.countDocuments({ projectId: project._id });
    const documentCount = await Document.countDocuments({
      projectId: project._id,
    });
    const completedTasks = await Task.countDocuments({
      projectId: project._id,
      status: "completed",
    });
    const activeTasks = await Task.countDocuments({
      projectId: project._id,
      status: { $ne: "completed" },
    });

    const progress =
      taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

    res.json({
      ...project.toObject(),
      taskCount,
      documentCount,
      completedTasks,
      activeTasks,
      progress,
    });
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

router.post(
  "/",
  auth,
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required (max 200 chars)"),
    body("description")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description is required (max 1000 chars)"),
    body("type")
      .optional()
      .isIn(["web-application", "mobile-app", "research", "ai-ml", "other"])
      .withMessage("Invalid project type"),
    body("status")
      .optional()
      .isIn(["planning", "active", "on-hold", "completed"])
      .withMessage("Invalid status"),
    body("deadline").optional().isISO8601().withMessage("Invalid deadline"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: errors.array() });
      }

      const { title, description, type, status, deadline } = req.body;

      const project = new Project({
        title,
        description,
        type: type || "web-application",
        status: status || "active",
        deadline: deadline ? new Date(deadline) : null,
        createdBy: req.user._id,
        teamMembers: [
          { user: req.user._id, role: "lead", joinedAt: new Date() },
        ],
      });

      await project.save();
      await project.populate("createdBy", "name email");
      await project.populate("teamMembers.user", "name email");

      res.status(201).json(project);
    } catch (err) {
      console.error("Error creating project:", err);
      res.status(500).json({ message: "Failed to create project" });
    }
  }
);

router.put(
  "/:id",
  auth,
  [
    body("title").optional().trim().isLength({ max: 200 }),
    body("description").optional().trim().isLength({ max: 1000 }),
    body("type")
      .optional()
      .isIn(["web-application", "mobile-app", "research", "ai-ml", "other"]),
    body("status")
      .optional()
      .isIn(["planning", "active", "on-hold", "completed"]),
    body("deadline").optional().isISO8601(),
    body("progress").optional().isInt({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: errors.array() });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasPermission =
        project.createdBy.toString() === req.user._id.toString() ||
        project.teamMembers.some(
          (m) =>
            m.user.toString() === req.user._id.toString() &&
            ["lead", "admin"].includes(m.role)
        );

      if (!hasPermission) {
        return res.status(403).json({ message: "Permission denied" });
      }

      ["title", "description", "type", "status", "progress"].forEach(
        (field) => {
          if (req.body[field] !== undefined) {
            project[field] = req.body[field];
          }
        }
      );

      if (req.body.deadline !== undefined) {
        project.deadline = req.body.deadline
          ? new Date(req.body.deadline)
          : null;
      }

      await project.save();
      await project.populate("createdBy", "name email");
      await project.populate("teamMembers.user", "name email");

      res.json(project);
    } catch (err) {
      console.error("Error updating project:", err);
      res.status(500).json({ message: "Failed to update project" });
    }
  }
);

router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the creator  delete this project" });
    }

    await Task.deleteMany({ projectId: project._id });
    await Document.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(project._id);

    res.json({ message: "Project and related data deleted" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

router.post(
  "/:id/members",
  auth,
  [
    body("userId").isMongoId().withMessage("Valid user ID required"),
    body("role").isIn(["lead", "admin", "member"]).withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: errors.array() });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const hasPermission =
        project.createdBy.toString() === req.user._id.toString() ||
        project.teamMembers.some(
          (m) =>
            m.user.toString() === req.user._id.toString() &&
            ["lead", "admin"].includes(m.role)
        );

      if (!hasPermission) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const { userId, role } = req.body;

      if (project.teamMembers.some((m) => m.user.toString() === userId)) {
        return res.status(400).json({ message: "User already a member" });
      }

      project.teamMembers.push({
        user: userId,
        role: role || "member",
        joinedAt: new Date(),
      });

      await project.save();
      await project.populate("teamMembers.user", "name email");

      res.json(project);
    } catch (err) {
      console.error("Error adding member:", err);
      res.status(500).json({ message: "Failed to add member" });
    }
  }
);

router.delete("/:id/members/:userId", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const hasPermission =
      project.createdBy.toString() === req.user._id.toString() ||
      project.teamMembers.some(
        (m) =>
          m.user.toString() === req.user._id.toString() &&
          ["lead", "admin"].includes(m.role)
      );

    if (!hasPermission) {
      return res.status(403).json({ message: "Permission denied" });
    }

    if (project.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ message: "Creator cannot be removed" });
    }

    project.teamMembers = project.teamMembers.filter(
      (m) => m.user.toString() !== req.params.userId
    );

    await project.save();
    await project.populate("teamMembers.user", "name email");

    res.json(project);
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: "Failed to remove member" });
  }
});

export default router;
