import nodemailer from "nodemailer";
import config from "../config/index.js";
import logger from "./logger.js";

let transporterPromise = null;

const getSmtpConfig = () => ({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  user: config.mail.user,
  pass: config.mail.pass,
  from: config.mail.from,
});

const hasSmtpConfig = () =>
  Boolean(
    getSmtpConfig().host &&
      getSmtpConfig().port &&
      getSmtpConfig().user &&
      getSmtpConfig().pass &&
      getSmtpConfig().from
  );

const isValidSender = (value) =>
  typeof value === "string" && /<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const createTransporter = async () => {
  const smtp = getSmtpConfig();

  if (!hasSmtpConfig()) {
    throw new Error("SMTP is not configured.");
  }
  if (!isValidSender(smtp.from)) {
    throw new Error("SMTP_FROM is invalid.");
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port),
    secure: smtp.secure === "true" || Number(smtp.port) === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  logger.info("Verifying SMTP transporter", {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure === true || Number(smtp.port) === 465,
    user: smtp.user,
    from: smtp.from,
  });
  await transporter.verify();
  logger.info("SMTP transporter verified successfully");
  return transporter;
};

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter().catch((error) => {
      transporterPromise = null;
      throw error;
    });
  }
  return transporterPromise;
};

const sendVerificationEmail = async (email, code) => {
  const smtp = getSmtpConfig();
  const transporter = await getTransporter();

  logger.info("Sending verification email", { email });
  const info = await transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: "Verify your StudyPal account",
    text: `Your StudyPal verification code is ${code}. Use it within 10 minutes to finish creating your account.`,
    html: `<p>Your StudyPal verification code is <strong>${code}</strong>.</p><p>Use it within 10 minutes to finish creating your account.</p>`,
  });
  logger.info("Verification email sent", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
  return info;
};

const sendPasswordResetEmail = async (email, code) => {
  const smtp = getSmtpConfig();
  const transporter = await getTransporter();

  logger.info("Sending password reset email", { email });
  const info = await transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: "StudyPal password reset code",
    text: `Your StudyPal verification code is ${code}. Use it within 10 minutes to reset your password.`,
    html: `<p>Your StudyPal verification code is <strong>${code}</strong>.</p><p>Use it within 10 minutes to reset your password.</p>`,
  });
  logger.info("Password reset email sent", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
  return info;
};

const sendOtpEmail = async ({ email, code, purpose }) => {
  if (purpose === "register") {
    return sendVerificationEmail(email, code);
  }
  return sendPasswordResetEmail(email, code);
};

export {
  hasSmtpConfig,
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
