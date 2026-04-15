import db from "../models/index.js";

const SwapShiftRequest = db.swapshiftrequest;
const SwapShiftResponse = db.swapshiftresponse;
const UserShift = db.usershift;
const Shift = db.shift;
const Schedule = db.schedule;
const DepartmentUser = db.departmentusers;
const User = db.user;
const Op = db.Sequelize.Op;

const exports = {};
let swapShiftRequestColumnsPromise = null;

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
    const fullRecord = await loadRequestForRead(data.ID);
    res.send(fullRecord || data);
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
