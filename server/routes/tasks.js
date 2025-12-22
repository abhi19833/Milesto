import express from "express";
import { body, validationResult } from "express-validator";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    }).select("_id");

    const tasks = await Task.find({ projectId: { $in: projects } })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "title")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res
      .status(500)
      .json({ message: "Could not fetch tasks Please try again." });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "title");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);
    const canAccess =
      project.createdBy.equals(req.user._id) ||
      project.teamMembers.some((m) => m.user.equals(req.user._id));

    if (!canAccess)
      return res
        .status(403)
        .json({ message: "You don’t have access to this task" });

    res.json(task);
  } catch (err) {
    console.error("Error fetching task:", err);
    res
      .status(500)
      .json({ message: "Could not fetch the task. Please try again." });
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
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description too long (max 1000 chars)"),
    body("projectId").isMongoId().withMessage("Invalid project ID"),
    body("priority")
      .isIn(["low", "medium", "high"])
      .withMessage("Priority must be low, medium, or high"),
    body("assignedTo")
      .optional({ checkFalsy: true })
      .isMongoId()
      .withMessage("Invalid assigned user"),
    body("dueDate")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601()
      .withMessage("Invalid due date"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: errors.array() });
      }

      const { title, description, projectId, priority, assignedTo, dueDate } =
        req.body;

      const project = await Project.findById(projectId);
      if (!project)
        return res.status(404).json({ message: "Project not found" });

      const canAccess =
        project.createdBy.equals(req.user._id) ||
        project.teamMembers.some((m) => m.user.equals(req.user._id));

      if (!canAccess)
        return res
          .status(403)
          .json({ message: "You do nort have access to this project" });

      const task = new Task({
        title,
        description,
        projectId,
        priority,
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: req.user._id,
      });

      await task.save();
      await task.populate([
        { path: "assignedTo", select: "name email" },
        { path: "createdBy", select: "name email" },
        { path: "projectId", select: "title" },
      ]);

      res.status(201).json(task);
    } catch (err) {
      console.error("Error creating task:", err);
      res
        .status(500)
        .json({ message: "Could not create task. Please try again." });
    }
  }
);

router.patch(
  "/:id",
  auth,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title too long (max 200 chars)"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description too long (max 1000 chars)"),
    body("status")
      .optional()
      .isIn(["todo", "in-progress", "completed"])
      .withMessage("Invalid status"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high"])
      .withMessage("Invalid priority"),
    body("assignedTo")
      .optional()
      .isMongoId()
      .withMessage("Invalid assigned user"),
    body("dueDate")
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601()
      .withMessage("Invalid due date"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: errors.array() });
      }

      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      const project = await Project.findById(task.projectId);
      const canAccess =
        project.createdBy.equals(req.user._id) ||
        project.teamMembers.some((m) => m.user.equals(req.user._id));

      if (!canAccess)
        return res
          .status(403)
          .json({ message: "You don not have access to this task" });

      const updatable = [
        "title",
        "description",
        "status",
        "priority",
        "assignedTo",
      ];
      updatable.forEach((field) => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });

      if (req.body.dueDate !== undefined) {
        task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
      }

      await task.save();
      await task.populate([
        { path: "assignedTo", select: "name email" },
        { path: "createdBy", select: "name email" },
        { path: "projectId", select: "title" },
      ]);

      res.json(task);
    } catch (err) {
      console.error("Error updating task:", err);
      res
        .status(500)
        .json({ message: "Could not update task Please try again." });
    }
  }
);

router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);
    const canAccess =
      project.createdBy.equals(req.user._id) ||
      project.teamMembers.some((m) => m.user.equals(req.user._id));

    if (!canAccess)
      return res
        .status(403)
        .json({ message: "You don’t have access to this task" });

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res
      .status(500)
      .json({ message: "Could not delete task Please try again." });
  }
});

export default router;
