const nodemailer = require("nodemailer");

let transporterPromise = null;

const getTransporter = async () => {
  if (transporterPromise) {
    return transporterPromise;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    transporterPromise = Promise.resolve(null);
    return transporterPromise;
  }

  transporterPromise = Promise.resolve(
    nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  );

  return transporterPromise;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) {
    return;
  }

  const transporter = await getTransporter();
  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: recipients.join(", "),
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };
