import db from "../models/index.js";
const Shift = db.shift;

const exports = {};

// Create a new shift
exports.create = (req, res) => {
  const {
    shift_date,
    start_time,
    end_time,
    workers_required,
    scheduleID,
    positionID,
  } = req.body;

  if (!shift_date || !start_time || !end_time || !scheduleID) {
    res.status(400).send({
      message:
        "shift_date, start_time, end_time, and scheduleID are required.",
    });
    return;
  }

  const shift = {
    shift_date,
    start_time,
    end_time,
    workers_required: workers_required ?? 1,
    scheduleID,
    positionID: positionID ?? null,
  };

  Shift.create(shift)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Shift.",
      })
    );
};

// Get all shifts
exports.findAll = (req, res) => {
  const { scheduleID, positionID, shift_date } = req.query;

  const where = {};
  if (scheduleID) where.scheduleID = scheduleID;
  if (positionID) where.positionID = positionID;
  if (shift_date) where.shift_date = shift_date;

  Shift.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving shifts.",
      })
    );
};

// Get one shift by ID
exports.findOne = (req, res) => {
  const id = req.params.id;

  Shift.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find Shift with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({ message: "Error retrieving Shift with ID=" + id })
    );
};

// Update a shift by ID
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  Shift.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "Shift updated successfully." });
      else {
        res.send({
          message: `Cannot update Shift with ID=${id}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Error updating Shift with ID=" + id })
    );
};

// Delete a shift by ID
exports.delete = (req, res) => {
  const id = req.params.id;

  Shift.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Shift deleted successfully!" });
      else {
        res.send({
          message: `Cannot delete Shift with ID=${id}. Maybe it was not found!`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Could not delete Shift with ID=" + id })
    );
};

export default exports;
