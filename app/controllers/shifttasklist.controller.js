import db from "../models/index.js";

const ShiftTaskList = db.shifttasklist;

const exports = {};

exports.create = (req, res) => {
  const { shiftID, task_listID } = req.body;

  if (!shiftID || !task_listID) {
    res.status(400).send({ message: "shiftID and task_listID are required." });
    return;
  }

  ShiftTaskList.create({ shiftID, task_listID })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the ShiftTaskList.",
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
        message: err.message || "Some error occurred while retrieving shift task lists.",
      })
    );
};

exports.findOne = (req, res) => {
  const id = req.params.id;

  ShiftTaskList.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find ShiftTaskList with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({ message: "Error retrieving ShiftTaskList with ID=" + id })
    );
};

exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  ShiftTaskList.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "ShiftTaskList updated successfully." });
      else {
        res.send({
          message: `Cannot update ShiftTaskList with ID=${id}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Error updating ShiftTaskList with ID=" + id })
    );
};

exports.delete = (req, res) => {
  const id = req.params.id;
  const { shiftID, task_listID } = req.query;

  const where = id ? { ID: id } : {};
  if (!id && shiftID) where.shiftID = shiftID;
  if (!id && task_listID) where.task_listID = task_listID;

  if (!id && !shiftID && !task_listID) {
    res.status(400).send({ message: "An ID or shift/task list pair is required." });
    return;
  }

  ShiftTaskList.destroy({ where })
    .then((num) => {
      if (num >= 1) res.send({ message: "ShiftTaskList deleted successfully!" });
      else {
        res.send({
          message: "Cannot delete ShiftTaskList. Maybe it was not found.",
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Could not delete the requested ShiftTaskList record." })
    );
};

export default exports;
