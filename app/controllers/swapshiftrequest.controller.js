import nodemailer from "nodemailer";
import db from "../models/index.js";

const SwapShiftRequest = db.swapshiftrequest;
const SwapShiftResponse = db.swapshiftresponse;
const UserShift = db.usershift;
const Shift = db.shift;
const Schedule = db.schedule;
const DepartmentUser = db.departmentusers;
const User = db.user;
const Position = db.position;
const Op = db.Sequelize.Op;

const exports = {};
let swapShiftRequestColumnsPromise = null;

const normalizeText = (value) => String(value || "").trim();
const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const normalizeRequestStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (["accepted", "approved"].includes(normalized)) return "accepted";
  if (["pending approval", "pending_approval", "needs approval"].includes(normalized)) {
    return "pending_approval";
  }
  if (["cancelled", "canceled", "denied", "rejected"].includes(normalized)) return "cancelled";
  return "open";
};

const toStoredRequestStatus = (value) => {
  const normalized = normalizeRequestStatus(value);
  if (normalized === "accepted") return "Accepted";
  if (normalized === "pending_approval") return "Pending Approval";
  if (normalized === "cancelled") return "Cancelled";
  return "Pending";
};

const normalizeResponseStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["approved", "accepted"].includes(normalized)) return "approved";
  if (["rejected", "cancelled", "canceled", "denied"].includes(normalized)) return "rejected";
  return "pending";
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const chunkArray = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
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

const getSwapShiftRequestColumns = async () => {
  if (!swapShiftRequestColumnsPromise) {
    swapShiftRequestColumnsPromise = db.sequelize
      .getQueryInterface()
      .describeTable("swap_shift_requests")
      .catch((error) => {
        swapShiftRequestColumnsPromise = null;
        throw error;
      });
  }

  return swapShiftRequestColumnsPromise;
};

const toPositiveInt = (value) => {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const getDepartmentMembership = async (userID, departmentID, transaction) => {
  if (!userID || !departmentID) return null;

  return DepartmentUser.findOne({
    where: { userID, departmentID },
    transaction,
  });
};

const getRequestDepartmentID = async (request, transaction) => {
  const userShift = await UserShift.findByPk(request.userShiftID, { transaction });
  if (!userShift?.shiftID) return null;

  const shift = await Shift.findByPk(userShift.shiftID, { transaction });
  if (!shift?.scheduleID) return null;

  const schedule = await Schedule.findByPk(shift.scheduleID, { transaction });
  return toPositiveInt(schedule?.departmentID);
};

const isUserInDepartment = async (userID, departmentID, transaction) => {
  return Boolean(await getDepartmentMembership(userID, departmentID, transaction));
};

const formatTime = (value) => {
  const hhmm = String(value || "").slice(0, 5);
  const [hoursRaw, minutesRaw] = hhmm.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return hhmm || "TBD";

  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 || 12;
  return `${twelveHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

const formatShiftDate = (value) => {
  if (!value) return "an upcoming shift";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTradeNotificationRecipients = async (departmentID) => {
  if (!departmentID) return [];

  const departmentLinks = await DepartmentUser.findAll({
    where: {
      departmentID,
      role: { [Op.in]: ["worker", "manager", "Worker", "Manager"] },
    },
  });

  const recipientUserIDs = [
    ...new Set(
      departmentLinks
        .map((link) => Number(link.userID))
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ];

  if (!recipientUserIDs.length) return [];

  const users = await User.findAll({
    where: {
      ID: { [Op.in]: recipientUserIDs },
      status: "active",
    },
    attributes: ["ID", "name", "email"],
  });

  return [
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
};

const createTradeBoardEmailHtml = ({
  requesterName,
  shiftDate,
  startTime,
  endTime,
  positionTitle,
}) => `
  <div style="background:#f4f6f8;padding:32px 16px;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:#72151A;padding:20px 24px;">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#f9d8da;">
          Trade Board
        </div>
        <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:#ffffff;">A shift was added to the trade board</h1>
      </div>
      <div style="padding:24px;color:#202124;">
        <p style="margin:0 0 16px;line-height:1.6;">
          ${escapeHtml(requesterName || "A team member")} posted a shift to the trade board.
        </p>
        <p style="margin:0 0 8px;line-height:1.6;"><strong>Shift:</strong> ${escapeHtml(shiftDate)}</p>
        <p style="margin:0 0 8px;line-height:1.6;"><strong>Time:</strong> ${escapeHtml(startTime)} - ${escapeHtml(endTime)}</p>
        <p style="margin:0;line-height:1.6;"><strong>Position:</strong> ${escapeHtml(positionTitle || "Shift")}</p>
      </div>
    </div>
  </div>
`;

const sendTradeBoardCreatedEmail = async ({ requestID, userShiftID, requesterUserID }) => {
  const request = await SwapShiftRequest.findByPk(requestID);
  if (!request) return { recipientCount: 0, sent: false };

  const departmentID = await getRequestDepartmentID(request);
  if (!departmentID) return { recipientCount: 0, sent: false };

  const [userShift, requesterUser, recipients] = await Promise.all([
    UserShift.findByPk(userShiftID),
    requesterUserID ? User.findByPk(requesterUserID, { attributes: ["ID", "name", "email"] }) : null,
    getTradeNotificationRecipients(departmentID),
  ]);

  if (!userShift?.shiftID || !recipients.length) {
    return { recipientCount: 0, sent: false };
  }

  const shift = await Shift.findByPk(userShift.shiftID);
  const position = shift?.positionID ? await Position.findByPk(shift.positionID) : null;

  const shiftDateLabel = formatShiftDate(shift?.shift_date);
  const startTimeLabel = formatTime(shift?.start_time);
  const endTimeLabel = formatTime(shift?.end_time);
  const positionTitle = normalizeText(position?.title) || "Shift";
  const requesterName = normalizeText(requesterUser?.name) || "A team member";

  const subject = "A shift was added to the trade board";
  const message =
    `${requesterName} posted a shift to the trade board.\n\n` +
    `Shift: ${shiftDateLabel}\n` +
    `Time: ${startTimeLabel} - ${endTimeLabel}\n` +
    `Position: ${positionTitle}`;
  const html = createTradeBoardEmailHtml({
    requesterName,
    shiftDate: shiftDateLabel,
    startTime: startTimeLabel,
    endTime: endTimeLabel,
    positionTitle,
  });
  const batches = chunkArray(recipients, 50);

  for (const batch of batches) {
    await sendWithGmail({
      recipients: batch,
      subject,
      message,
      html,
      replyTo: requesterUser?.email
        ? { email: requesterUser.email, name: requesterName }
        : null,
    });
  }

  return { recipientCount: recipients.length, sent: true };
};

const loadRequestForRead = (id) =>
  SwapShiftRequest.findByPk(id, {
    include: [
      { model: UserShift },
      {
        model: SwapShiftResponse,
        as: "responses",
        include: [{ model: User, as: "responder", attributes: ["ID", "name", "email", "role"] }],
      },
    ],
    order: [[{ model: SwapShiftResponse, as: "responses" }, "createdAt", "ASC"]],
  });

const cancelOtherOpenRequests = async (request, transaction) => {
  const siblingRequests = await SwapShiftRequest.findAll({
    where: {
      userShiftID: request.userShiftID,
      ID: { [Op.ne]: request.ID },
      status: { [Op.notIn]: ["Accepted", "Cancelled"] },
    },
    attributes: ["ID"],
    transaction,
  });

  const siblingRequestIDs = siblingRequests
    .map((row) => toPositiveInt(row?.ID))
    .filter(Boolean);

  await SwapShiftRequest.update(
    { status: "Cancelled" },
    {
      where: { ID: { [Op.in]: siblingRequestIDs } },
      transaction,
    }
  );

  if (siblingRequestIDs.length) {
    await SwapShiftResponse.update(
      { status: "Rejected" },
      {
        where: {
          swapShiftRequestID: { [Op.in]: siblingRequestIDs },
          status: { [Op.ne]: "Approved" },
        },
        transaction,
      }
    );
  }
};

// Create a new Swap Shift Request
exports.create = async (req, res) => {
  if (!req.body.userShiftID) {
    res.status(400).send({ message: "User Shift ID cannot be empty!" });
    return;
  }

  try {
    const columns = await getSwapShiftRequestColumns();
    const request = {
      status: toStoredRequestStatus(req.body.status),
      userShiftID: req.body.userShiftID,
    };

    if (Object.prototype.hasOwnProperty.call(columns, "reason")) {
      request.reason = String(req.body.reason || "").trim() || null;
    }

    const data = await SwapShiftRequest.create(request);
    let emailNotification = null;

    try {
      emailNotification = await sendTradeBoardCreatedEmail({
        requestID: data.ID,
        userShiftID: data.userShiftID,
        requesterUserID: req.userID,
      });
    } catch (emailError) {
      console.error("Trade board email notification failed:", emailError);
      emailNotification = {
        sent: false,
        recipientCount: 0,
        warning: emailError?.message || "Email notification could not be sent.",
      };
    }

    const fullRecord = await loadRequestForRead(data.ID);
    const responsePayload =
      typeof fullRecord?.toJSON === "function"
        ? fullRecord.toJSON()
        : typeof data?.toJSON === "function"
          ? data.toJSON()
          : (fullRecord || data);

    res.send({
      ...responsePayload,
      emailNotification,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error occurred while creating the request.",
    });
  }
};

// Retrieve all requests (can filter by status)
exports.findAll = async (req, res) => {
  try {
    const status = req.query.status;
    const condition = status ? { status: { [Op.like]: `%${status}%` } } : null;

    const data = await SwapShiftRequest.findAll({
      where: condition,
      include: [
        { model: UserShift },
        {
          model: SwapShiftResponse,
          as: "responses",
          include: [{ model: User, as: "responder", attributes: ["ID", "name", "email", "role"] }],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: SwapShiftResponse, as: "responses" }, "createdAt", "ASC"],
      ],
    });

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving requests.",
    });
  }
};

// Find a single request by swapShiftRequestID
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await loadRequestForRead(id);
    if (data) res.send(data);
    else res.status(404).send({ message: `Request with id=${id} not found.` });
  } catch (err) {
    res.status(500).send({ message: "Error retrieving request with id=" + id });
  }
};

// Update a request
exports.update = async (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: "Request body cannot be empty." });
  }

  const transaction = await db.sequelize.transaction();

  try {
    const columns = await getSwapShiftRequestColumns();
    const request = await SwapShiftRequest.findByPk(id, { transaction });
    if (!request) {
      await transaction.rollback();
      return res.status(404).send({ message: `Request with id=${id} not found.` });
    }

    const requestDepartmentID = await getRequestDepartmentID(request, transaction);
    const normalizedRole = normalizeRole(req.userRole);
    const requestedStatus = normalizeRequestStatus(req.body.status || request.status);
    const approvedUserID = toPositiveInt(req.body.approvedUserID ?? req.body.selectedUserID);
    const currentRequestStatus = normalizeRequestStatus(request.status);

    if (requestedStatus === "accepted" && approvedUserID) {
      if (normalizedRole !== "manager") {
        await transaction.rollback();
        return res.status(403).send({ message: "Only managers can approve trade requests." });
      }

      if (!(await isUserInDepartment(req.userID, requestDepartmentID, transaction))) {
        await transaction.rollback();
        return res.status(403).send({ message: "You cannot approve requests outside your department." });
      }

      if (["accepted", "cancelled"].includes(currentRequestStatus)) {
        await transaction.rollback();
        return res.status(400).send({ message: "This trade request is no longer available." });
      }

      const requestUserShift = await UserShift.findByPk(request.userShiftID, { transaction });
      if (!requestUserShift) {
        await transaction.rollback();
        return res.status(404).send({
          message: `UserShift with ID=${request.userShiftID} was not found.`,
        });
      }

      const selectedMembership = await getDepartmentMembership(
        approvedUserID,
        requestDepartmentID,
        transaction
      );
      if (!selectedMembership) {
        await transaction.rollback();
        return res.status(404).send({ message: "The selected person is not in this department." });
      }

      const selectedDepartmentRole = normalizeRole(selectedMembership.role);
      if (!["worker", "manager"].includes(selectedDepartmentRole)) {
        await transaction.rollback();
        return res.status(400).send({
          message: "Only department workers or managers can be assigned to this trade request.",
        });
      }

      if (Number(requestUserShift.userID) === Number(approvedUserID)) {
        await transaction.rollback();
        return res.status(400).send({
          message: "That person already owns the shift tied to this trade request.",
        });
      }

      const [selectedResponse] = await SwapShiftResponse.findOrCreate({
        where: {
          swapShiftRequestID: request.ID,
          responderUserID: approvedUserID,
        },
        defaults: { status: "Approved" },
        transaction,
      });

      if (normalizeResponseStatus(selectedResponse.status) !== "approved") {
        await selectedResponse.update({ status: "Approved" }, { transaction });
      }

      await requestUserShift.update({ userID: approvedUserID }, { transaction });
      await request.update({ status: "Accepted" }, { transaction });

      await SwapShiftResponse.update(
        { status: "Rejected" },
        {
          where: {
            swapShiftRequestID: request.ID,
            responderUserID: { [Op.ne]: approvedUserID },
            status: { [Op.ne]: "Approved" },
          },
          transaction,
        }
      );

      await cancelOtherOpenRequests(request, transaction);
      await transaction.commit();

      const fullRecord = await loadRequestForRead(request.ID);
      return res.send({
        message: "Trade request approved and shift reassigned successfully.",
        request: fullRecord,
        requestID: request.ID,
        userShiftID: requestUserShift.ID,
        assignedUserID: approvedUserID,
      });
    }

    if (requestedStatus === "accepted") {
      if (!req.userID) {
        await transaction.rollback();
        return res.status(401).send({ message: "Authenticated user not found." });
      }

      if (!(await isUserInDepartment(req.userID, requestDepartmentID, transaction))) {
        await transaction.rollback();
        return res.status(403).send({ message: "You cannot accept a request outside your department." });
      }

      const requestUserShift = await UserShift.findByPk(request.userShiftID, { transaction });
      if (!requestUserShift) {
        await transaction.rollback();
        return res.status(404).send({
          message: `UserShift with ID=${request.userShiftID} was not found.`,
        });
      }

      if (Number(requestUserShift.userID) === Number(req.userID)) {
        await transaction.rollback();
        return res.status(400).send({ message: "You already own this shift." });
      }

      if (["accepted", "cancelled"].includes(currentRequestStatus)) {
        await transaction.rollback();
        return res.status(400).send({ message: "This trade request is no longer available." });
      }

      const [response] = await SwapShiftResponse.findOrCreate({
        where: {
          swapShiftRequestID: request.ID,
          responderUserID: req.userID,
        },
        defaults: { status: "Pending" },
        transaction,
      });

      if (normalizeResponseStatus(response.status) !== "pending") {
        await response.update({ status: "Pending" }, { transaction });
      }

      await request.update({ status: "Pending Approval" }, { transaction });
      await transaction.commit();

      const fullRecord = await loadRequestForRead(request.ID);
      return res.send({
        message: "Trade request sent to the manager for approval.",
        request: fullRecord,
        requestID: request.ID,
        responderUserID: req.userID,
      });
    }

    const payload = { ...req.body };
    delete payload.approvedUserID;
    delete payload.selectedUserID;

    if (!Object.prototype.hasOwnProperty.call(columns, "reason")) {
      delete payload.reason;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "status")) {
      payload.status = toStoredRequestStatus(payload.status);
    }

    if (normalizeRequestStatus(payload.status || request.status) === "cancelled") {
      await SwapShiftResponse.destroy({
        where: { swapShiftRequestID: request.ID },
        transaction,
      });
    }

    if (normalizeRequestStatus(payload.status || request.status) === "open") {
      payload.status = "Pending";
      await SwapShiftResponse.destroy({
        where: { swapShiftRequestID: request.ID },
        transaction,
      });
    }

    await request.update(payload, { transaction });
    await transaction.commit();

    const fullRecord = await loadRequestForRead(request.ID);
    return res.send({
      message: "Request updated successfully.",
      request: fullRecord,
    });
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return res.status(500).send({
      message: err.message || "Error updating request with id=" + id,
    });
  }
};

// Delete a request
exports.delete = (req, res) => {
  const id = req.params.id;

  SwapShiftRequest.destroy({ where: { ID: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Request deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete request with id=${id}.` });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Could not delete request with id=" + id })
    );
};

export default exports;
