import express from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Document from "../models/Document.js";
import auth from "../middleware/auth.js";
import { generateDashboardInsights } from "../utils/aiService.js";

const router = express.Router();

router.get("/stats", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    });

    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ projectId: { $in: projectIds } });
    const documents = await Document.find({ projectId: { $in: projectIds } });

    const stats = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      totalDocuments: documents.length,
      completedTasks: tasks.filter((t) => t.status === "completed").length,
      pendingTasks: tasks.filter((t) => t.status !== "completed").length,
      activeProjects: projects.filter((p) => p.status === "active").length,
      completedProjects: projects.filter((p) => p.status === "completed")
        .length,
    };

    const recentProjects = projects
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        status: p.status,
        progress: p.progress || 0,
        updatedAt: p.updatedAt,
      }));

    const recentTasks = tasks
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map((t) => ({
        _id: t._id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        updatedAt: t.updatedAt,
      }));

    const insights = [];
    const completionRate =
      stats.totalTasks > 0
        ? (stats.completedTasks / stats.totalTasks) * 100
        : 0;

    if (completionRate > 80) {
      insights.push({
        title: "Great job!",
        message: `You finished ${completionRate.toFixed(0)}% of your tasks.`,
        type: "success",
      });
    } else if (completionRate < 50) {
      insights.push({
        title: "Lots left to do",
        message: `${stats.pendingTasks} tasks  pending. Focus on priorities first.`,
        type: "warning",
      });
    }

    if (stats.activeProjects === 0 && stats.totalProjects > 0) {
      insights.push({
        title: "No active projects",
        message: "Looks like none of your projects is active right now.",
        type: "info",
      });
    }

    if (stats.totalDocuments === 0) {
      insights.push({
        title: "Missing docs",
        message: "Upload project documents to enable smarter AI .",
        type: "info",
      });
    }

    res.json({
      ...stats,
      recentProjects,
      recentTasks,
      insights,
      completionRate: Math.round(completionRate),
      projects,
      tasks,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Could not load dashboard stats" });
  }
});

router.get("/recent-projects", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("createdBy", "name email")
      .populate("teamMembers.user", "name email");

    res.json(projects);
  } catch (err) {
    console.error("Recent projects error:", err);
    res.status(500).json({ message: "Could not fetch recent projects" });
  }
});

router.get("/recent-tasks", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    }).select("_id");

    const ids = projects.map((p) => p._id);

    const tasks = await Task.find({ projectId: { $in: ids } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "title");

    res.json(tasks);
  } catch (err) {
    console.error("Recent tasks error:", err);
    res.status(500).json({ message: "Could not fetch recent tasks" });
  }
});

router.get("/dashboard/ai-insights", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    });

    const ids = projects.map((p) => p._id);
    const tasks = await Task.find({ projectId: { $in: ids } });
    const docs = await Document.find({ projectId: { $in: ids } });

    console.log("Generating AI insights for dashboard");
    const aiInsights = await generateDashboardInsights(projects, tasks, docs);

    res.json({
      insights: aiInsights,
      recommendations: aiInsights.map((i) => i.description),
    });
  } catch (err) {
    console.error("AI insights error:", err);
    res.status(500).json({ message: "Could not generate AI insights" });
  }
});

export default router;
