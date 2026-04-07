import nodemailer from "nodemailer";
import db from "../models/index.js";

const Announcement = db.announcement;
const DepartmentUser = db.departmentusers;
const User = db.user;
const Op = db.Sequelize.Op;

const exportsObj = {};

const AUDIENCE_CONFIG = {
  "all-workers": {
    label: "All Workers",
    roles: ["worker"],
  },
  "all-staff": {
    label: "All Staff",
    roles: ["worker", "manager"],
  },
  managers: {
    label: "Managers Only",
    roles: ["manager"],
  },
};

const normalizeText = (value) => String(value || "").trim();
const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const normalizeAudience = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return AUDIENCE_CONFIG[key] ? key : "";
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createAnnouncementHtml = ({ subject, message, managerName }) => {
  const safeSubject = escapeHtml(subject);
  const paragraphs = String(message || "")
    .split(/\n{2,}/)
    .map((block) =>
      `<p style="margin:0 0 16px;line-height:1.6;color:#202124;">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  return `
    <div style="background:#f4f6f8;padding:32px 16px;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:#72151A;padding:20px 24px;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#f9d8da;">
            Team Announcement
          </div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:#ffffff;">${safeSubject}</h1>
        </div>
        <div style="padding:24px;">
          ${paragraphs}
          <p style="margin:24px 0 0;color:#5f6368;font-size:14px;">
            Sent by ${escapeHtml(managerName || "Management")}
          </p>
        </div>
      </div>
    </div>
  `;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const getUserDepartmentID = async (userID) => {
  const userLinks = await DepartmentUser.findAll({
    where: { userID },
  });

  const prioritizedLink =
    userLinks.find(
      (link) => String(link.role || "").trim().toLowerCase() === "manager"
    ) || userLinks[0];

  return prioritizedLink?.departmentID ?? null;
};

const getGmailTransporter = () => {
  const gmailUser = normalizeText(process.env.GMAIL_USER);
  const gmailAppPassword = normalizeText(process.env.GMAIL_APP_PASSWORD);

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      "Gmail is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in the backend environment."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

const sendWithGmail = async ({ recipients, subject, message, html, replyTo }) => {
  const gmailUser = normalizeText(process.env.GMAIL_USER);
  const fromName = normalizeText(process.env.GMAIL_FROM_NAME) || "Worker Scheduling";
  const transporter = getGmailTransporter();

  await transporter.sendMail({
    from: `"${fromName}" <${gmailUser}>`,
    to: gmailUser,
    bcc: recipients.map((recipient) =>
      recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email
    ),
    replyTo: replyTo?.email
      ? replyTo.name
        ? `"${replyTo.name}" <${replyTo.email}>`
        : replyTo.email
      : undefined,
    subject,
    text: message,
    html,
  });
};

exportsObj.send = async (req, res) => {
  try {
    if (normalizeRole(req.userRole) !== "manager") {
      return res.status(403).send({ message: "Only managers can send announcements." });
    }

    const audience = "all-workers";
    const subject = normalizeText(req.body.subject);
    const message = normalizeText(req.body.message);
    if (!subject) {
      return res.status(400).send({ message: "Subject is required." });
    }
    if (!message) {
      return res.status(400).send({ message: "Message is required." });
    }

    const managerDepartmentID = await getUserDepartmentID(req.userID);

    if (!managerDepartmentID) {
      return res.status(400).send({ message: "No manager department was found for this account." });
    }

    const managerUser = await User.findByPk(req.userID);

    const departmentLinks = await DepartmentUser.findAll({
      where: { departmentID: managerDepartmentID },
    });

    const allowedRoles = AUDIENCE_CONFIG[audience].roles;
    const recipientUserIDs = [
      ...new Set(
        departmentLinks
          .filter((link) =>
            allowedRoles.includes(String(link.role || "").trim().toLowerCase())
          )
          .map((link) => Number(link.userID))
          .filter((id) => Number.isFinite(id) && id > 0)
      ),
    ];

    if (!recipientUserIDs.length) {
      return res.status(404).send({ message: "No recipients were found for the selected audience." });
    }

    const users = await User.findAll({
      where: {
        ID: { [Op.in]: recipientUserIDs },
        status: "active",
      },
      attributes: ["ID", "name", "email"],
    });

    const recipients = [
      ...new Map(
        users
          .filter((user) => normalizeText(user.email))
          .map((user) => [
            normalizeText(user.email).toLowerCase(),
            {
              email: normalizeText(user.email),
              name: normalizeText(user.name),
            },
          ])
      ).values(),
    ];

    if (!recipients.length) {
      return res.status(404).send({ message: "No active recipients with valid email addresses were found." });
    }

    const html = createAnnouncementHtml({
      subject,
      message,
      managerName: managerUser?.name,
    });

    const batches = chunkArray(recipients, 50);
    for (const batch of batches) {
      await sendWithGmail({
        recipients: batch,
        subject,
        message,
        html,
        replyTo: managerUser?.email
          ? { email: managerUser.email, name: managerUser?.name || "Manager" }
          : null,
      });
    }

    const announcement = await Announcement.create({
      subject,
      message,
      departmentID: managerDepartmentID,
      createdByUserID: req.userID,
      recipientCount: recipients.length,
    });

    return res.send({
      message: "Announcement sent successfully.",
      audience,
      audienceLabel: AUDIENCE_CONFIG[audience].label,
      recipientCount: recipients.length,
      departmentID: managerDepartmentID,
      announcement,
    });
  } catch (error) {
    console.error("Announcement send error:", error);
    return res.status(500).send({
      message:
        error?.message || "Failed to send the announcement email.",
    });
  }
};

exportsObj.findAll = async (req, res) => {
  try {
    const normalizedRole = normalizeRole(req.userRole);
    if (normalizedRole !== "manager" && normalizedRole !== "worker") {
      return res.status(403).send({ message: "Only managers and workers can view announcement history." });
    }

    const departmentID = await getUserDepartmentID(req.userID);
    if (!departmentID) {
      return res.status(400).send({ message: "No department was found for this account." });
    }

    const announcements = await Announcement.findAll({
      where: { departmentID },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["ID", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.send({
      announcements,
      departmentID,
    });
  } catch (error) {
    console.error("Announcement history error:", error);
    return res.status(500).send({
      message: error?.message || "Failed to load announcement history.",
    });
  }
};

export default exportsObj;
