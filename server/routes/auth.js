import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import crypto from "crypto";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";
import { sendResetPasswordEmail } from "../utils/emailService.js";

const router = express.Router();

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is too short"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 chars"),
    body("university")
      .trim()
      .isLength({ min: 2 })
      .withMessage("University is requiredd"),
    body("role")
      .isIn(["student", "faculty"])
      .withMessage("Role must be student oor faculty"),
    body("invitationToken").optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, university, role, invitationToken } =
        req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res
          .status(400)
          .json({ message: "An account already exists with email." });
      }

      const user = new User({ name, email, password, university, role });
      await user.save();

      const joinedProjects = [];

      if (invitationToken) {
        const invite = await Invitation.findOne({
          token: invitationToken,
          email,
          status: "pending",
        });

        if (invite) {
          const project = await Project.findById(invite.projectId);
          if (project) {
            project.teamMembers.push({
              user: user._id,
              role: invite.role,
              joinedAt: new Date(),
            });
            await project.save();

            invite.status = "accepted";
            await invite.save();

            joinedProjects.push(project.title);
          }
        }
      } else {
        const pending = await Invitation.find({
          email,
          status: "pending",
        }).populate("projectId");

        for (const invite of pending) {
          const project = await Project.findById(invite.projectId);
          if (project) {
            project.teamMembers.push({
              user: user._id,
              role: invite.role,
              joinedAt: new Date(),
            });
            await project.save();

            invite.status = "accepted";
            await invite.save();

            joinedProjects.push(project.title);
          }
        }
      }

      const token = createToken(user._id);

      res.status(201).json({
        message:
          joinedProjects.length > 0
            ? `Registered and added to: ${joinedProjects.join(", ")}`
            : "Registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          university: user.university,
          role: user.role,
        },
        joinedProjects: joinedProjects.length,
      });
    } catch (err) {
      console.error("Register error:", err);
      res
        .status(500)
        .json({ message: "Something went wrong while registering" });
    }
  }
);
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ msg: "If email exists reset link sent" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendResetPasswordEmail(user.email, resetUrl);

  res.json({ msg: "Reset link sent" });
});
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ msg: "Invalid or expired token" });
  }

  user.password = password;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ msg: "Password reset successful" });
});

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");
      if (!user)
        return res.status(400).json({ message: "Invalid email or password" });

      if (!user.isActive) {
        return res.status(400).json({ message: "This account is deactivated" });
      }
      console.log("LOGIN USER PASSWORD HASH:", user.password);

      const isMatch = await user.comparePassword(password);
      console.log("BCRYPT RESULT:", isMatch);

      if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });

      user.lastLogin = new Date();
      await user.save();

      const token = createToken(user._id);

      res.json({
        message: "Logged in",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          university: user.university,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed please try again" });
    }
  }
);

router.get("/verify", auth, (req, res) => {
  try {
    res.json({
      message: "Token is valid",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        university: req.user.university,
        role: req.user.role,
      },
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Token verification failed" });
  }
});

router.patch(
  "/password",
  auth,
  [body("currentPassword").exists(), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      const match = await user.comparePassword(currentPassword);
      if (!match)
        return res.status(400).json({ message: "Wrong current password" });

      user.password = newPassword;
      await user.save();

      res.json({ message: "Password changed" });
    } catch (err) {
      console.error("Password change error:", err);
      res.status(500).json({ message: "Could not change password" });
    }
  }
);

export default router;
