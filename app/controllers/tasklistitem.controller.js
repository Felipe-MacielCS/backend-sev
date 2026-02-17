import db from "../models/index.js";
const TaskListItem = db.tasklistitem;
const Op = db.Sequelize.Op;

const exports = {};

// Create a new Task List Item
exports.create = (req, res) => {
  if (!req.body.name || !req.body.taskListID) {
    res.status(400).send({ message: "Name and Task List ID are required!" });
    return;
  }

  const taskListItem = {
    name: req.body.name,
    description: req.body.description,
    taskListID: req.body.taskListID,
  };

  TaskListItem.create(taskListItem)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error occurred while creating the TaskListItem.",
      })
    );
};

// Retrieve all items (filter by taskListID)
exports.findAll = (req, res) => {
  const taskListID = req.query.taskListID;
  let condition = taskListID ? { taskListID: taskListID } : null;

  TaskListItem.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving task list items.",
      })
    );
};

// Find a single item by taskListItemID
exports.findOne = (req, res) => {
  const id = req.params.id;

  TaskListItem.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `TaskListItem with id=${id} not found.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving TaskListItem with id=" + id })
    );
};

// Update a Task List Item
exports.update = (req, res) => {
  const id = req.params.id;

  TaskListItem.update(req.body, { where: { taskListItemID: id } })
    .then((num) => {
      if (num == 1) res.send({ message: "TaskListItem updated successfully." });
      else res.send({ message: `Cannot update TaskListItem with id=${id}.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error updating TaskListItem with id=" + id })
    );
};

// Delete a Task List Item
exports.delete = (req, res) => {
  const id = req.params.id;

  TaskListItem.destroy({ where: { taskListItemID: id } })
    .then((num) => {
      if (num == 1) res.send({ message: "TaskListItem deleted successfully!" });
      else res.send({ message: `Cannot delete TaskListItem with id=${id}.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Could not delete TaskListItem with id=" + id })
    );
};

export default exports;