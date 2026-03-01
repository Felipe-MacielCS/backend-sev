import db from "../models/index.js";
const TaskListItemStatus = db.tasklistitemstatus;
const Op = db.Sequelize.Op;

const exports = {};

// Create a new status entry
exports.create = (req, res) => {
  if (!req.body.status || !req.body.taskListItemID || !req.body.userShiftID) {
    res.status(400).send({ message: "Status, Task Item ID, and User Shift ID are required!" });
    return;
  }

  const statusData = {
    description: req.body.description,
    status: req.body.status,
    date_checked: req.body.date_checked,
    checked_by: req.body.checked_by,
    taskListItemID: req.body.taskListItemID,
    userShiftID: req.body.userShiftID,
  };

  TaskListItemStatus.create(statusData)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error occurred while creating the status entry.",
      })
    );
};

// Retrieve all status entries (filterable by userShiftID)
exports.findAll = (req, res) => {
  const userShiftID = req.query.userShiftID;
  let condition = userShiftID ? { userShiftID: userShiftID } : null;

  TaskListItemStatus.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving status entries.",
      })
    );
};

// Find one by taskListItemStatusID
exports.findOne = (req, res) => {
  const id = req.params.id;

  TaskListItemStatus.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Status entry with id=${id} not found.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving status entry with id=" + id })
    );
};

// Update a status entry
exports.update = (req, res) => {
  const id = req.params.id;

  TaskListItemStatus.update(req.body, { where: { taskListItemStatusID: id } })
    .then((num) => {
      if (num == 1) res.send({ message: "Status updated successfully." });
      else res.send({ message: `Cannot update status with id=${id}.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error updating status entry with id=" + id })
    );
};

// Delete a status entry
exports.delete = (req, res) => {
  const id = req.params.id;

  TaskListItemStatus.destroy({ where: { taskListItemStatusID: id } })
    .then((num) => {
      if (num == 1) res.send({ message: "Status deleted successfully!" });
      else res.send({ message: `Cannot delete status entry with id=${id}.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Could not delete status entry with id=" + id })
    );
};

export default exports;