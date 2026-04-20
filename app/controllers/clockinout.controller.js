import db from "../models/index.js";
const ClockInOut = db.clockinout;
const UserShift = db.usershift;

const exports = {};

const normalizeID = (raw) => {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const parseClockDate = (value, fieldName) => {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} must be a valid date/time.`);
    error.status = 400;
    throw error;
  }
  return date;
};

const validateClockRange = (clockInTime, clockOutTime) => {
  if (!clockInTime) {
    const error = new Error("clock_in_time is required.");
    error.status = 400;
    throw error;
  }

  if (clockOutTime && clockOutTime < clockInTime) {
    const error = new Error("clock_out_time must be after clock_in_time.");
    error.status = 400;
    throw error;
  }
};

const ensureUserShiftExists = async (userShiftID) => {
  const userShift = await UserShift.findByPk(userShiftID);
  if (!userShift) {
    const error = new Error(`UserShift with ID=${userShiftID} was not found.`);
    error.status = 404;
    throw error;
  }
};

const ensureNoOtherOpenRecord = async (userShiftID, currentRecordID = null) => {
  const existing = await ClockInOut.findOne({
    where: { user_shift_id: userShiftID, clock_out_time: null },
    order: [["clock_in_time", "DESC"]],
  });

  if (existing && Number(existing.ID) !== Number(currentRecordID)) {
    const error = new Error("User already has an open clock record for this shift.");
    error.status = 400;
    throw error;
  }
};

// Clock In
exports.clockIn = async (req, res) => {
  try {
    const user_shift_id = req.params.userShiftID;

    const existing = await ClockInOut.findOne({
      where: { user_shift_id, clock_out_time: null },
      order: [["clock_in_time", "DESC"]],
    });

    if (existing) {
      return res.status(400).send({ message: "User is already clocked in." });
    }

    const data = await ClockInOut.create({
      user_shift_id,
      clock_in_time: new Date(),
      clock_out_time: null,
    });

    return res.status(201).send({
      message: "Clock-in successful!",
      data,
    });

  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error during clock-in.",
    });
  }
};

// Clock Out
exports.clockOut = async (req, res) => {
  try {
    const user_shift_id = req.params.userShiftID;

    const record = await ClockInOut.findOne({
      where: { user_shift_id, clock_out_time: null },
      order: [["clock_in_time", "DESC"]],
    });

    if (!record) {
      return res.status(400).send({ message: "No active clock-in found." });
    }

    record.clock_out_time = new Date();
    await record.save();

    return res.send({
      message: "Clock-out successful!",
      data: record,
    });

  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error during clock-out.",
    });
  }
};

// Create a manual timecard record
exports.create = async (req, res) => {
  try {
    const userShiftID = normalizeID(
      req.body.user_shift_id ?? req.body.userShiftID ?? req.body.user_shiftID
    );

    if (!userShiftID) {
      return res.status(400).send({ message: "user_shift_id is required." });
    }

    const clockInTime = parseClockDate(req.body.clock_in_time ?? req.body.clockInTime, "clock_in_time");
    const clockOutTime = parseClockDate(req.body.clock_out_time ?? req.body.clockOutTime, "clock_out_time");

    validateClockRange(clockInTime, clockOutTime);
    await ensureUserShiftExists(userShiftID);

    if (!clockOutTime) {
      await ensureNoOtherOpenRecord(userShiftID);
    }

    const data = await ClockInOut.create({
      user_shift_id: userShiftID,
      clock_in_time: clockInTime,
      clock_out_time: clockOutTime,
    });

    return res.status(201).send({
      message: "Clock record created successfully.",
      data,
    });
  } catch (err) {
    return res.status(err.status || 500).send({
      message: err.message || "Error creating clock record.",
    });
  }
};

// Update a manual timecard correction
exports.update = async (req, res) => {
  try {
    const id = normalizeID(req.params.id);
    if (!id) {
      return res.status(400).send({ message: "Clock record ID is required." });
    }

    const record = await ClockInOut.findByPk(id);
    if (!record) {
      return res.status(404).send({ message: `Clock record with ID=${id} was not found.` });
    }

    const nextClockInTime =
      "clock_in_time" in req.body || "clockInTime" in req.body
        ? parseClockDate(req.body.clock_in_time ?? req.body.clockInTime, "clock_in_time")
        : record.clock_in_time;
    const nextClockOutTime =
      "clock_out_time" in req.body || "clockOutTime" in req.body
        ? parseClockDate(req.body.clock_out_time ?? req.body.clockOutTime, "clock_out_time")
        : record.clock_out_time;

    validateClockRange(nextClockInTime, nextClockOutTime);

    if (!nextClockOutTime) {
      await ensureNoOtherOpenRecord(record.user_shift_id, record.ID);
    }

    record.clock_in_time = nextClockInTime;
    record.clock_out_time = nextClockOutTime;
    await record.save();

    return res.send({
      message: "Clock record updated successfully.",
      data: record,
    });
  } catch (err) {
    return res.status(err.status || 500).send({
      message: err.message || "Error updating clock record.",
    });
  }
};

// Get timecard records for a user_shift
exports.findByUserShift = async (req, res) => {
  try {
    const user_shift_id = req.params.userShiftID;

    const rows = await ClockInOut.findAll({
      where: { user_shift_id },
      order: [["clock_in_time", "DESC"]],
    });

    return res.send(rows);

  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error retrieving clock records.",
    });
  }
};

export default exports;
