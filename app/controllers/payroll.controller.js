import db from "../models/index.js";

const { Op } = db.Sequelize;

const ClockInOut = db.clockinout;
const UserShift = db.usershift;
const Shift = db.shift;
const User = db.user;
const Position = db.position;
const DepartmentUser = db.departmentusers;
const PayrollOverride = db.payrolloverride;

const exportsObj = {};

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekEnd(weekStart) {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return toISODate(end);
}

function diffHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;
  const ms = new Date(clockOut) - new Date(clockIn);
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms / (1000 * 60 * 60);
}

exportsObj.getWeeklyPayroll = async (req, res) => {
  try {
    const departmentID = Number(req.params.departmentID);
    const weekStart = String(req.query.week_start || "").trim();

    if (!Number.isFinite(departmentID) || departmentID <= 0) {
      return res.status(400).send({ message: "Valid departmentID is required." });
    }

    if (!weekStart) {
      return res.status(400).send({ message: "week_start is required." });
    }

    const weekEnd = getWeekEnd(weekStart);

    const clockRows = await ClockInOut.findAll({
      where: {
        clock_in_time: {
          [Op.gte]: new Date(`${weekStart}T00:00:00`),
          [Op.lt]: new Date(`${weekEnd}T23:59:59`),
        },
      },
      include: [
        {
          model: UserShift,
          required: true,
          include: [
            {
              model: Shift,
              required: true,
              where: {
                shift_date: {
                  [Op.between]: [weekStart, weekEnd],
                },
              },
              include: [
                {
                  model: Position,
                  required: false,
                  attributes: ["positionID", "title", "pay_rate"],
                },
              ],
            },
            {
              model: User,
              required: true,
            },
          ],
        },
      ],
      order: [["clock_in_time", "ASC"]],
    });

    const departmentUsers = await DepartmentUser.findAll({
      where: { departmentID },
      attributes: ["ID", "userID", "departmentID", "role", "employee_pay_rate"],
    });

    const deptUserMap = {};
    const departmentUserIDs = new Set();
    for (const row of departmentUsers) {
      deptUserMap[row.userID] = row;
      departmentUserIDs.add(Number(row.userID));
    }

    const overrides = await PayrollOverride.findAll({
      where: {
        departmentID,
        week_start: weekStart,
      },
    });

    const overrideMap = {};
    for (const row of overrides) {
      overrideMap[row.user_shift_id] = row;
    }

    const entries = clockRows
      .filter((clock) => {
        const userShift = clock.userShift || clock.usershift || null;
        return departmentUserIDs.has(Number(userShift?.userID));
      })
      .map((clock) => {
        const userShift = clock.userShift || clock.usershift || null;
        if (!userShift) return null;

        const shift = userShift.shift;
        const user = userShift.user;
        const position = shift?.position || null;
        const deptUser = deptUserMap[userShift.userID] || null;
        const override = overrideMap[userShift.ID] || null;

        const baseHours = diffHours(clock.clock_in_time, clock.clock_out_time);
        const baseRate =
          deptUser?.employee_pay_rate != null
            ? Number(deptUser.employee_pay_rate)
            : position?.pay_rate != null
              ? Number(position.pay_rate)
              : 0;

        const effectiveHours =
          override?.override_hours != null ? Number(override.override_hours) : baseHours;

        const effectiveRate =
          override?.override_hourly_rate != null
            ? Number(override.override_hourly_rate)
            : baseRate;

        return {
          ID: userShift.ID,
          user_shift_id: userShift.ID,
          employee_name: user?.name || "Unknown Employee",
          position_name: position?.title || "",
          shift_date: shift?.shift_date || null,
          clock_in_time: clock.clock_in_time,
          clock_out_time: clock.clock_out_time,
          base_hours: Number(baseHours.toFixed(2)),
          effective_hours: Number(effectiveHours.toFixed(2)),
          base_rate: Number(baseRate.toFixed(2)),
          effective_rate: Number(effectiveRate.toFixed(2)),
          total_pay: Number((effectiveHours * effectiveRate).toFixed(2)),
          notes: override?.notes || "",
        };
      })
      .filter(Boolean);

    const totalHours = entries.reduce((sum, row) => sum + Number(row.effective_hours || 0), 0);
    const totalPayroll = entries.reduce((sum, row) => sum + Number(row.total_pay || 0), 0);

    return res.send({
      week_start: weekStart,
      week_end: weekEnd,
      total_hours: Number(totalHours.toFixed(2)),
      total_payroll: Number(totalPayroll.toFixed(2)),
      entries,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message || "Failed to build weekly payroll.",
    });
  }
};

exportsObj.savePayrollOverride = async (req, res) => {
  try {
    const id = Number(req.params.userShiftID);
    const {
      departmentID,
      week_start,
      override_hours,
      override_hourly_rate,
      notes,
    } = req.body;

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).send({ message: "Valid userShiftID is required." });
    }

    if (!departmentID || !week_start) {
      return res.status(400).send({ message: "departmentID and week_start are required." });
    }

    const [record] = await PayrollOverride.findOrCreate({
      where: {
        departmentID,
        user_shift_id: id,
        week_start,
      },
      defaults: {
        departmentID,
        user_shift_id: id,
        week_start,
        override_hours: override_hours ?? null,
        override_hourly_rate: override_hourly_rate ?? null,
        notes: notes ?? "",
      },
    });

    await record.update({
      override_hours: override_hours ?? null,
      override_hourly_rate: override_hourly_rate ?? null,
      notes: notes ?? "",
    });

    return res.send({
      message: "Payroll override saved.",
      data: record,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message || "Failed to save payroll override.",
    });
  }
};

exportsObj.clearPayrollOverride = async (req, res) => {
  try {
    const id = Number(req.params.userShiftID);
    const weekStart = String(req.query.week_start || "").trim();
    const departmentID = Number(req.query.departmentID);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).send({ message: "Valid userShiftID is required." });
    }

    if (!Number.isFinite(departmentID) || departmentID <= 0 || !weekStart) {
      return res.status(400).send({ message: "departmentID and week_start are required." });
    }

    await PayrollOverride.destroy({
      where: {
        departmentID,
        user_shift_id: id,
        week_start: weekStart,
      },
    });

    return res.send({ message: "Payroll override cleared." });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message || "Failed to clear payroll override.",
    });
  }
};

export default exportsObj;
