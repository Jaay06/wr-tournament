import nodemailer from "nodemailer";

type PasswordResetEmail = {
  displayName: string;
  expiresInMinutes: number;
  resetUrl: string;
  to: string;
};

type SmtpConfig = {
  from: string;
  host: string;
  password: string;
  port: number;
  user: string;
};

export type PasswordResetDeliveryKind = "console" | "smtp" | "unavailable";

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535 ||
    !user ||
    !password ||
    !from
  ) {
    return null;
  }

  return { from, host, password, port, user };
}

export function getPasswordResetDeliveryKind(): PasswordResetDeliveryKind {
  if (getSmtpConfig()) {
    return "smtp";
  }

  return process.env.NODE_ENV === "development" ? "console" : "unavailable";
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "account";
  }

  return `${localPart.slice(0, 1)}***@${domain}`;
}

export async function sendPasswordResetEmail({
  displayName,
  expiresInMinutes,
  resetUrl,
  to,
}: PasswordResetEmail) {
  const config = getSmtpConfig();

  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[password-reset] Development reset link for ${maskEmail(to)}: ${resetUrl}`,
      );
      return "console" as const;
    }

    throw new Error("Password-reset email delivery is not configured.");
  }

  const safeDisplayName = displayName.trim() || "there";
  const subject = "Reset your Rift Clash password";
  const text = [
    `Hello ${safeDisplayName},`,
    "",
    "Someone requested a new password for your Rift Clash account.",
    "",
    "Reset your password:",
    resetUrl,
    "",
    `This link expires in ${expiresInMinutes} minutes and works once. If you did not request this, you can ignore this email.`,
  ].join("\n");
  const html = [
    `<p>Hello ${escapeHtml(safeDisplayName)},</p>`,
    "<p>Someone requested a new password for your Rift Clash account.</p>",
    `<p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p>`,
    `<p>This link expires in ${expiresInMinutes} minutes and works once. If you did not request this, you can ignore this email.</p>`,
  ].join("");

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.password,
      user: config.user,
    },
    host: config.host,
    port: config.port,
    secure: config.port === 465,
  });

  await transporter.sendMail({
    from: config.from,
    html,
    subject,
    text,
    to,
  });

  return "smtp" as const;
}

