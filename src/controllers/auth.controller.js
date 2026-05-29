import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getJwtSecret } from "../config/env.js";
import {
  isEmailConfigured,
  sendPasswordResetEmail,
} from "../utils/sendEmail.js";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const validRoles = ["user", "prime", "admin"];

const normalizeRole = (role) => {
  const r = (role || "user").toString().toLowerCase();
  return validRoles.includes(r) ? r : "user";
};

/* =========================
   REGISTER
========================= */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!username || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        hint: "No account found with this email. If using local backend, register again or use the same MongoDB as production.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.role = normalizeRole(user.role);
    user.isOnline = true;
    user.lastActiveAt = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   CHANGE PASSWORD (logged in)
========================= */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   FORGOT PASSWORD (send OTP)
========================= */
export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const genericMessage =
      "If an account exists with this email, a reset code has been sent.";

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({ message: genericMessage, expiresInMinutes: 15 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const payload = {
      message: genericMessage,
      expiresInMinutes: 15,
      emailSent: false,
      emailConfigured: isEmailConfigured(),
    };

    try {
      const emailResult = await sendPasswordResetEmail(
        normalizedEmail,
        otp,
        user.username
      );
      payload.emailSent = true;

      if (emailResult.mode === "smtp") {
        payload.message =
          "Reset code sent to your email. Check your inbox and spam folder.";
      } else if (emailResult.previewUrl) {
        payload.emailPreviewUrl = emailResult.previewUrl;
        payload.message =
          "Test email sent. Open the preview link below to see your reset code.";
      }
    } catch (emailErr) {
      console.error("RESET EMAIL ERROR:", emailErr.message);
      payload.emailError = emailErr.message;
    }

    if (
      !payload.emailSent &&
      (process.env.NODE_ENV !== "production" ||
        process.env.RESET_OTP_DEV_MODE === "true")
    ) {
      payload.devOtp = otp;
      console.log(`[DEV] Password reset OTP for ${normalizedEmail}: ${otp}`);
    }

    if (!payload.emailSent && !payload.devOtp) {
      payload.message =
        "Could not send email. Configure SMTP in Backend/.env (see .env.example).";
    }

    res.json(payload);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   VERIFY OTP + RESET PASSWORD
========================= */
export const verifyResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, reset code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    if (user.resetOtpExpires.getTime() < Date.now()) {
      user.resetOtp = null;
      user.resetOtpExpires = null;
      await user.save();
      return res.status(400).json({ message: "Reset code has expired. Request a new one." });
    }

    const otpValid = await bcrypt.compare(String(otp).trim(), user.resetOtp);
    if (!otpValid) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.json({ message: "Password reset successful. You can log in now." });
  } catch (error) {
    console.error("VERIFY RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESET PASSWORD (legacy — disabled)
========================= */
export const resetPassword = async (req, res) => {
  return res.status(410).json({
    message: "Direct password reset is disabled. Use forgot password with OTP verification.",
  });
};

/* =========================
   LOGOUT (JWT)
========================= */
export const logout = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.userId || req.user?.id;
    const user = await User.findById(userId);

    if (user) {
      user.isOnline = false;
      user.lastActiveAt = new Date();
      await user.save();
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE ACCOUNT (JWT)
========================= */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
    UPDATE USERNAME (JWT)
========================= */
export const updateUsername = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const { newUsername } = req.body;

    const trimmed = (newUsername || "").trim();
    if (!trimmed || trimmed.length < 2) {
      return res.status(400).json({ message: "Username must be at least 2 characters" });
    }
    if (trimmed.length > 30) {
      return res.status(400).json({ message: "Username must be 30 characters or less" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.username = trimmed;
    await user.save();

    res.json({
      message: "Username updated successfully",
      username: user.username,
    });
  } catch (err) {
    console.error("UPDATE USERNAME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE AVATAR (accepts data URL in JSON)
   Note: This endpoint expects { avatar: "data:image/...;base64,..." }
========================= */
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ message: "Avatar data is required" });
    }

    // Reject very large payloads server-side to avoid storing huge base64 strings
    const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
    if (typeof avatar === "string" && avatar.length > MAX_BYTES) {
      return res.status(413).json({ message: "Avatar payload too large" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.avatar = avatar;
    await user.save();

    res.json({ message: "Avatar updated successfully", avatar: user.avatar });
  } catch (err) {
    console.error("UPDATE AVATAR ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

