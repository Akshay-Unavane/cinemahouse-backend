import nodemailer from "nodemailer";

let etherealCache = null;

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
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
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
}

async function getEtherealTransport() {
  if (etherealCache) return etherealCache;

  const testAccount = await nodemailer.createTestAccount();
  etherealCache = {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    user: testAccount.user,
  };

  console.log("📧 Ethereal test inbox ready:", testAccount.user);
  return etherealCache;
}

export async function verifyEmailConnection() {
  if (!isEmailConfigured()) return { ok: false, mode: "none" };

  try {
    const transporter = createSmtpTransport();
    await transporter.verify();
    return { ok: true, mode: "smtp" };
  } catch (err) {
    return { ok: false, mode: "smtp", error: err.message };
  }
}

/**
 * Sends reset OTP email.
 * Returns { previewUrl } for Ethereal in local dev, or {} for real SMTP.
 */
export async function sendPasswordResetEmail(to, otp, username = "there") {
  const from =
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER
      ? `CinemaHouse <${process.env.SMTP_USER}>`
      : "CinemaHouse <noreply@cinemahouse.local>");

  const content = buildMailContent(otp, username);

  if (isEmailConfigured()) {
    const transporter = createSmtpTransport();
    await transporter.sendMail({
      from,
      to,
      ...content,
    });
    return { mode: "smtp" };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMTP is not configured");
  }

  const { transporter } = await getEtherealTransport();
  const info = await transporter.sendMail({
    from: `CinemaHouse <${etherealCache.user}>`,
    to,
    ...content,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log("📧 Ethereal preview URL:", previewUrl);

  return { mode: "ethereal", previewUrl };
}

export function getEmailModeLabel() {
  if (isEmailConfigured()) return "SMTP (real email)";
  if (process.env.NODE_ENV === "production") return "disabled";
  return "Ethereal test inbox (local dev)";
}
