import db from "../models/index.js";
const ClockInOut = db.clockinout;

const exports = {};

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
