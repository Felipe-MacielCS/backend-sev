import db from "../models/index.js";

const ShiftTaskList = db.shifttasklist;

const exports = {};

exports.create = (req, res) => {
  const { shiftID, task_listID } = req.body;

  if (!shiftID || !task_listID) {
    res.status(400).send({ message: "shiftID and task_listID are required." });
    return;
  }

  ShiftTaskList.findOrCreate({
    where: { shiftID, task_listID },
    defaults: { shiftID, task_listID },
  })
    .then(([data]) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while assigning tasklist to shift.",
      })
    );
};

exports.findAll = (req, res) => {
  const { shiftID, task_listID } = req.query;

  const where = {};
  if (shiftID) where.shiftID = shiftID;
  if (task_listID) where.task_listID = task_listID;

  ShiftTaskList.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving shift tasklists.",
      })
    );
};

exports.findOne = (req, res) => {
  ShiftTaskList.findByPk(req.params.id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find ShiftTaskList with ID=${req.params.id}.` });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || `Error retrieving ShiftTaskList with ID=${req.params.id}.`,
      })
    );
};

exports.update = (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  ShiftTaskList.update(req.body, { where: { ID: req.params.id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;
      if (affected === 1) res.send({ message: "ShiftTaskList updated successfully." });
      else res.send({ message: `Cannot update ShiftTaskList with ID=${req.params.id}.` });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || `Error updating ShiftTaskList with ID=${req.params.id}.`,
      })
    );
};

exports.delete = (req, res) => {
  const { shiftID, task_listID } = req.query;
  const where = req.params.id ? { ID: req.params.id } : { shiftID, task_listID };

  if (!where.ID && (!where.shiftID || !where.task_listID)) {
    res.status(400).send({ message: "ID or shiftID and task_listID are required." });
    return;
  }

  ShiftTaskList.destroy({ where })
    .then((num) => {
      if (num >= 1) res.send({ message: "ShiftTaskList deleted successfully!" });
      else res.send({ message: "Cannot delete ShiftTaskList. Maybe it was not found!" });
    })
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Could not delete ShiftTaskList.",
      })
    );
};

export default exports;
