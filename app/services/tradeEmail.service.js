import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const formatTime = (value) => String(value || "").slice(0, 5);

export const sendTradeRequestNotification = async ({
  recipients,
  requesterName,
  shiftDate,
  startTime,
  endTime,
  positionTitle,
  reason,
}) => {
  const uniqueRecipients = [...new Set((recipients || []).filter(Boolean))];
  if (!uniqueRecipients.length) {
    return { sent: false, reason: "no-recipients" };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("Trade request email skipped: SMTP environment variables are not configured.");
    return { sent: false, reason: "smtp-not-configured" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `New trade request from ${requesterName || "a worker"}`;
  const text = [
    "A new shift trade request was posted.",
    "",
    `Worker: ${requesterName || "Unknown worker"}`,
    `Shift: ${positionTitle || "Shift"}`,
    `Date: ${shiftDate || "Unknown date"}`,
    `Time: ${formatTime(startTime)} - ${formatTime(endTime)}`,
    `Reason: ${reason || "No reason provided."}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin-bottom: 12px;">New shift trade request</h2>
      <p><strong>Worker:</strong> ${requesterName || "Unknown worker"}</p>
      <p><strong>Shift:</strong> ${positionTitle || "Shift"}</p>
      <p><strong>Date:</strong> ${shiftDate || "Unknown date"}</p>
      <p><strong>Time:</strong> ${formatTime(startTime)} - ${formatTime(endTime)}</p>
      <p><strong>Reason:</strong> ${reason || "No reason provided."}</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: from,
    bcc: uniqueRecipients,
    subject,
    text,
    html,
  });

  return { sent: true, count: uniqueRecipients.length };
};
