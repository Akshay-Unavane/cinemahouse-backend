import nodemailer from "nodemailer";

export function isEmailConfigured() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (process.env.SMTP_SERVICE?.trim() === "gmail") {
    return Boolean(user && pass);
  }
  return Boolean(process.env.SMTP_HOST?.trim() && user && pass);
}

function buildMailContent(otp, username = "there") {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#fff;padding:32px;border-radius:16px;">
      <h1 style="color:#01B4E4;margin:0 0 8px;">CinemaHouse</h1>
      <p style="color:#94a3b8;margin:0 0 24px;">Password reset request</p>
      <p>Hi ${username},</p>
      <p>Use this code to reset your password. It expires in <strong>15 minutes</strong>.</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#01B4E4;background:#020617;padding:20px;border-radius:12px;text-align:center;margin:24px 0;">
        ${otp}
      </div>
      <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  return {
    subject: "Your CinemaHouse password reset code",
    html,
    text: `Your CinemaHouse reset code is ${otp}. It expires in 15 minutes.`,
  };
}

function createSmtpTransport() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim().replace(/\s/g, "");

  if (process.env.SMTP_SERVICE?.trim() === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
}

export async function verifyEmailConnection() {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      mode: "none",
      error: "SMTP not configured. Set SMTP_SERVICE=gmail and SMTP_USER/SMTP_PASS in .env",
    };
  }

  try {
    const transporter = createSmtpTransport();
    await transporter.verify();
    return { ok: true, mode: "smtp" };
  } catch (err) {
    return { ok: false, mode: "smtp", error: err.message };
  }
}

export async function sendPasswordResetEmail(to, otp, username = "there") {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured on the server. Add SMTP settings to Backend/.env (see .env.example)."
    );
  }

  const from =
    process.env.SMTP_FROM?.trim() ||
    `CinemaHouse <${process.env.SMTP_USER?.trim()}>`;

  const transporter = createSmtpTransport();

  try {
    await transporter.verify();
  } catch (err) {
    throw new Error(
      `SMTP connection failed: ${err.message}. Check SMTP_USER and SMTP_PASS (use Gmail App Password, not normal password).`
    );
  }

  try {
    await transporter.sendMail({
      from,
      to,
      ...buildMailContent(otp, username),
    });
  } catch (err) {
    const hint =
      err.message?.includes("Invalid login") || err.message?.includes("535")
        ? " Use a Gmail App Password (16 chars), not your regular Gmail password."
        : "";
    throw new Error(`Failed to send email: ${err.message}.${hint}`);
  }

  return { mode: "smtp" };
}

export function getEmailModeLabel() {
  if (isEmailConfigured()) return "SMTP email enabled";
  return "SMTP not configured";
}
