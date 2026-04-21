import db from "../models/index.js";
const UserShiftTaskList = db.usershifttasklist;

const exports = {};

// Create (assign a task list to a specific user shift)
exports.create = (req, res) => {
  const { user_shiftID, task_listID } = req.body;

  if (!user_shiftID || !task_listID) {
    res.status(400).send({
      message: "user_shiftID and task_listID are required.",
    });
    return;
  }

  const record = { user_shiftID, task_listID };

  UserShiftTaskList.create(record)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while creating the UserShiftTaskList record.",
      })
    );
};

// Get all assignments
exports.findAll = (req, res) => {
  const { user_shiftID, task_listID } = req.query;

  const where = {};
  if (user_shiftID) where.user_shiftID = user_shiftID;
  if (task_listID) where.task_listID = task_listID;

  UserShiftTaskList.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while retrieving UserShiftTaskList records.",
      })
    );
};

// Get one by ID
exports.findOne = (req, res) => {
  const id = req.params.id;

  UserShiftTaskList.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else {
        res.status(404).send({
          message: `Cannot find UserShiftTaskList with ID=${id}.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({
        message: "Error retrieving UserShiftTaskList with ID=" + id,
      })
    );
};

// Update by ID
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  UserShiftTaskList.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) {
        res.send({ message: "UserShiftTaskList updated successfully." });
      } else {
        res.send({
          message: `Cannot update UserShiftTaskList with ID=${id}. Maybe not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({
        message: "Error updating UserShiftTaskList with ID=" + id,
      })
    );
};

// Delete by ID
exports.delete = (req, res) => {
  const id = req.params.id;

  UserShiftTaskList.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "UserShiftTaskList deleted successfully!" });
      else {
        res.send({
          message: `Cannot delete UserShiftTaskList with ID=${id}. Maybe it was not found!`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({
        message: "Could not delete UserShiftTaskList with ID=" + id,
      })
    );
};

export default exports;
