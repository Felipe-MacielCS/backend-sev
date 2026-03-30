import db from "../models/index.js";
import { sendTradeRequestNotification } from "../services/tradeEmail.service.js";

const SwapShiftRequest = db.swapshiftrequest;
const UserShift = db.usershift;
const Shift = db.shift;
const Schedule = db.schedule;
const DepartmentUser = db.departmentusers;
const User = db.user;
const Position = db.position;
const Op = db.Sequelize.Op;

const exports = {};

const notifyDepartmentTradeRequest = async (requestRecord) => {
  const userShift = await UserShift.findByPk(requestRecord.userShiftID);
  if (!userShift) return;

  const [shift, requester] = await Promise.all([
    Shift.findByPk(userShift.shiftID),
    User.findByPk(userShift.userID),
  ]);
  if (!shift) return;

  const schedule = await Schedule.findByPk(shift.scheduleID);
  if (!schedule?.departmentID) return;

  const [position, departmentLinks] = await Promise.all([
    shift.positionID ? Position.findByPk(shift.positionID) : null,
    DepartmentUser.findAll({ where: { departmentID: schedule.departmentID } }),
  ]);

  const recipientIDs = [
    ...new Set(
      departmentLinks
        .filter((link) => {
          const role = String(link.role || "").trim().toLowerCase();
          return role === "worker" || role === "manager";
        })
        .map((link) => Number(link.userID))
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ];
  if (!recipientIDs.length) return;

  const recipients = await User.findAll({
    where: {
      ID: { [Op.in]: recipientIDs },
      status: "active",
    },
  });

  await sendTradeRequestNotification({
    recipients: recipients.map((user) => user.email),
    requesterName: requester?.name || "Unknown worker",
    shiftDate: shift.shift_date,
    startTime: shift.start_time,
    endTime: shift.end_time,
    positionTitle: position?.title || `Shift ${shift.ID}`,
    reason: requestRecord.reason,
  });
};

// Create a new Swap Shift Request
exports.create = async (req, res) => {
  if (!req.body.userShiftID) {
    res.status(400).send({ message: "User Shift ID cannot be empty!" });
    return;
  }

  const request = {
    status: req.body.status || "Pending",
    userShiftID: req.body.userShiftID,
    reason: String(req.body.reason || "").trim() || null,
  };

  try {
    const data = await SwapShiftRequest.create(request);

    try {
      await notifyDepartmentTradeRequest(data);
    } catch (emailError) {
      console.error("Trade request email notification failed:", emailError);
    }

    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error occurred while creating the request.",
    });
  }
};

// Retrieve all requests (can filter by status)
exports.findAll = (req, res) => {
  const status = req.query.status;
  let condition = status ? { status: { [Op.like]: `%${status}%` } } : null;

  SwapShiftRequest.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving requests.",
      })
    );
};

// Find a single request by swapShiftRequestID
exports.findOne = (req, res) => {
  const id = req.params.id;

  SwapShiftRequest.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Request with id=${id} not found.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving request with id=" + id })
    );
};

// Update a request (e.g., a manager approving/denying it)
exports.update = async (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: "Request body cannot be empty." });
  }

  const transaction = await db.sequelize.transaction();

  try {
    const request = await SwapShiftRequest.findByPk(id, { transaction });
    if (!request) {
      await transaction.rollback();
      return res.status(404).send({ message: `Request with id=${id} not found.` });
    }

    const requestedStatus = String(req.body.status || request.status || "").trim();

    if (requestedStatus.toLowerCase() === "accepted") {
      const userShift = await UserShift.findByPk(request.userShiftID, { transaction });
      if (!userShift) {
        await transaction.rollback();
        return res.status(404).send({
          message: `UserShift with ID=${request.userShiftID} was not found.`,
        });
      }

      if (!req.userID) {
        await transaction.rollback();
        return res.status(401).send({ message: "Authenticated user not found." });
      }

      if (Number(userShift.userID) === Number(req.userID)) {
        await transaction.rollback();
        return res.status(400).send({ message: "You already own this shift." });
      }

      await userShift.update({ userID: req.userID }, { transaction });
      await request.update({ status: "Accepted" }, { transaction });

      await SwapShiftRequest.update(
        { status: "Cancelled" },
        {
          where: {
            userShiftID: request.userShiftID,
            ID: { [Op.ne]: request.ID },
            status: { [Op.notIn]: ["Accepted", "Cancelled"] },
          },
          transaction,
        }
      );

      await transaction.commit();
      return res.send({
        message: "Request accepted and shift reassigned successfully.",
        requestID: request.ID,
        userShiftID: userShift.ID,
        assignedUserID: req.userID,
      });
    }

    await request.update(req.body, { transaction });
    await transaction.commit();
    return res.send({ message: "Request updated successfully." });
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
    .catch((err) =>
      res.status(500).send({ message: "Could not delete request with id=" + id })
    );
};

export default exports;
