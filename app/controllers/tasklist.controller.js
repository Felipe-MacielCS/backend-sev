import db from "../models/index.js";
const TaskList = db.tasklist;

const exports = {};

// Create a new task list
exports.create = (req, res) => {
  const { name, description, departmentID } = req.body;

  if (!name || !departmentID) {
    res.status(400).send({ message: "name and departmentID are required." });
    return;
  }

  const taskList = {
    name,
    description: description ?? null,
    departmentID,
  };

  TaskList.create(taskList)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the TaskList.",
      })
    );
};

// Get all task lists
exports.findAll = (req, res) => {
  const { departmentID, name } = req.query;

  const where = {};
  if (departmentID) where.departmentID = departmentID;
  if (name) where.name = name;

  TaskList.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving task lists.",
      })
    );
};

// Get one task list by ID
exports.findOne = (req, res) => {
  const id = req.params.id;

  TaskList.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({ message: `Cannot find TaskList with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({
        message: "Error retrieving TaskList with ID=" + id,
      })
    );
};

// Update a task list by ID
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  TaskList.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "TaskList updated successfully." });
      else {
        res.send({
          message: `Cannot update TaskList with ID=${id}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({
        message: "Error updating TaskList with ID=" + id,
      })
    );
};

// Delete a task list by ID
exports.delete = (req, res) => {
  const id = req.params.id;

  TaskList.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "TaskList deleted successfully!" });
      else {
        res.send({
          message: `Cannot delete TaskList with ID=${id}. Maybe it was not found!`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({
        message: "Could not delete TaskList with ID=" + id,
      })
    );
};

export default exports;
