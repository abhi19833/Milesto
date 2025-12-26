import express from "express";
import { body, validationResult } from "express-validator";
import crypto from "crypto";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Invitation from "../models/Invitation.js";
import auth from "../middleware/auth.js";
import { sendInviteEmail } from "../utils/emailService.js";

const router = express.Router();

router.get("/members", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { "teamMembers.user": req.user._id }],
    }).populate("teamMembers.user", "name email university role createdt");

    const members = new Map();

    projects.forEach((project) => {
      project.teamMembers.forEach((m) => {
        const id = m.user._id.toString();

        if (!members.has(id)) {
          members.set(id, {
            _id: m.user._id,
            name: m.user.name,
            email: m.user.email,
            university: m.user.university,
            role: m.role,
            status: "active",
            joinedAt: m.joinedAt,
            createdAt: m.user.createdAt,
            projects: [],
          });
        }

        members.get(id).projects.push({
          _id: project._id,
          title: project.title,
          role: m.role,
        });
      });
    });

    res.json(Array.from(members.values()));
  } catch (err) {
    console.error("Error fetching team members:", err);
    res.status(500).json({ message: "Could not fetch team members." });
  }
});

router.get("/invitations", auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({
      invitedBy: req.user._id,
      status: "pending",
    })
      .populate("projectId", "title")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (err) {
    console.error("Error fetching invitations:", err);
    res.status(500).json({ message: "Could not fetch invitations." });
  }
});

router.post(
  "/invite",
  auth,
  [
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("role").isIn(["lead", "admin", "member"]).withMessage("Invalid role"),
    body("projectId").optional().isMongoId().withMessage("Invalid project ID"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: errors.array() });
      }

      const { email, role, projectId } = req.body;
      const user = await User.findOne({ email });

      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required." });
      }

      const project = await Project.findById(projectId);
      if (!project)
        return res.status(404).json({ message: "Project not found." });

      const canInvite =
        project.createdBy.equals(req.user._id) ||
        project.teamMembers.some(
          (m) =>
            m.user.equals(req.user._id) && ["lead", "admin"].includes(m.role)
        );

      if (!canInvite)
        return res
          .status(403)
          .json({ message: "You can not invite members to this project." });

      if (user) {
        const alreadyMember = project.teamMembers.some((m) =>
          m.user.equals(user._id)
        );
        if (alreadyMember) {
          return res
            .status(400)
            .json({ message: "User is already in this project." });
        }

        project.teamMembers.push({
          user: user._id,
          role,
          joinedAt: new Date(),
        });
        await project.save();
        await project.populate("teamMembers.user", "name email");

        return res.json({
          message: "User added to project",
          type: "existing_user",
          user: { _id: user._id, name: user.name, email: user.email, role },
        });
      }

      const token = crypto.randomBytes(32).toString("hex");

      const invitation = new Invitation({
        email,
        projectId,
        invitedBy: req.user._id,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await invitation.save();

      const inviteLink = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/register?token=${token}`;
      const emailResult = await sendInviteEmail(
        email,
        req.user.name,
        project.title,
        inviteLink,
        true
      );

      return res.json({
        message: "Invitation sent",
        type: "new_user",
        invitation: {
          _id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          emailSent: emailResult.success,
          createdAt: invitation.createdAt,
          projectId: { _id: project._id, title: project.title },
        },
      });
    } catch (err) {
      console.error("Error inviting member:", err);
      res.status(500).json({ message: "Could not send invitation." });
    }
  }
);

router.patch(
  "/members/:id",
  auth,
  [body("role").isIn(["lead", "admin", "member"]).withMessage("Invalid role")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: errors.array() });
      }

      const { role } = req.body;
      const memberId = req.params.id;

      const projects = await Project.find({
        $and: [
          {
            teamMembers: {
              $elemMatch: {
                user: req.user._id,
                role: { $in: ["lead", "admin"] },
              },
            },
          },
          { "teamMembers.user": memberId },
        ],
      });

      if (!projects.length) {
        return res
          .status(403)
          .json({ message: "Not allowed or member not found." });
      }

      await Promise.all(
        projects.map(async (project) => {
          const idx = project.teamMembers.findIndex(
            (m) => m.user.toString() === memberId
          );
          if (idx !== -1) project.teamMembers[idx].role = role;
          return project.save();
        })
      );

      res.json({ message: "Member role updated" });
    } catch (err) {
      console.error("Error updating member role:", err);
      res.status(500).json({ message: "Could not update member role." });
    }
  }
);

import mongoose from "mongoose";

router.delete("/members/:id", auth, async (req, res) => {
  try {
    const memberId = req.params.id;

    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid member ID" });
    }

    const projects = await Project.find({
      teamMembers: {
        $elemMatch: {
          user: req.user._id,
          role: { $in: ["lead", "admin"] },
        },
      },
      "teamMembers.user": memberId,
    });

    if (!projects.length) {
      return res
        .status(403)
        .json({ message: "Not allowed or member not found." });
    }

    await Promise.all(
      projects.map(async (project) => {
        if (project.createdBy.equals(memberId)) return null;

        project.teamMembers = project.teamMembers.filter(
          (m) => m.user.toString() !== memberId
        );
        return project.save();
      })
    );

    res.json({ message: "Member removed" });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ message: "Could not remove member." });
  }
});

router.delete("/invitations/:id", auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation)
      return res.status(404).json({ message: "Invitation not found." });

    const project = await Project.findById(invitation.projectId);

    if (!project) {
      await Invitation.findByIdAndDelete(req.params.id);
      return res.json({
        message: "Invitation cancelled .",
      });
    }

    const canCancel =
      project.createdBy.equals(req.user._id) ||
      project.teamMembers.some(
        (m) => m.user.equals(req.user._id) && ["lead", "admin"].includes(m.role)
      );

    if (!canCancel)
      return res
        .status(403)
        .json({ message: "You can not cancel this invitation." });

    await Invitation.findByIdAndDelete(req.params.id);

    res.json({ message: "Invitation cancelled" });
  } catch (err) {
    console.error("Error cancelling invitation:", err);
    res.status(500).json({ message: "Could not cancel invitation." });
  }
});

export default router;
