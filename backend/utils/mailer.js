import nodemailer from "nodemailer";

let transporterPromise = null;

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM,
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

  console.log(
    `[MAILER] Verifying SMTP transporter host=${smtp.host} port=${smtp.port} secure=${
      smtp.secure === "true" || Number(smtp.port) === 465
    } user=${smtp.user} from=${smtp.from}`
  );
  await transporter.verify();
  console.log("[MAILER] SMTP transporter verified successfully.");
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

  console.log(`[MAILER] Sending verification email to ${email}`);
  const info = await transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: "Verify your StudyPal account",
    text: `Your StudyPal verification code is ${code}. Use it within 10 minutes to finish creating your account.`,
    html: `<p>Your StudyPal verification code is <strong>${code}</strong>.</p><p>Use it within 10 minutes to finish creating your account.</p>`,
  });
  console.log(
    `[MAILER] Verification email result messageId=${info.messageId} accepted=${info.accepted?.join(",") || ""} rejected=${info.rejected?.join(",") || ""}`
  );
  return info;
};

const sendPasswordResetEmail = async (email, code) => {
  const smtp = getSmtpConfig();
  const transporter = await getTransporter();

  console.log(`[MAILER] Sending password reset email to ${email}`);
  const info = await transporter.sendMail({
    from: smtp.from,
    to: email,
    subject: "StudyPal password reset code",
    text: `Your StudyPal verification code is ${code}. Use it within 10 minutes to reset your password.`,
    html: `<p>Your StudyPal verification code is <strong>${code}</strong>.</p><p>Use it within 10 minutes to reset your password.</p>`,
  });
  console.log(
    `[MAILER] Password reset email result messageId=${info.messageId} accepted=${info.accepted?.join(",") || ""} rejected=${info.rejected?.join(",") || ""}`
  );
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
