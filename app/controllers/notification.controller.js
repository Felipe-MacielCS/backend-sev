import db from "../models/index.js";
const Notification = db.notification;

const exports = {};

// Create
exports.create = (req, res) => {
  const { message, departmentID, type, status } = req.body;

  if (!message) {
    res.status(400).send({ message: "message is required." });
    return;
  }

  const notification = {
    message,
    departmentID: departmentID ?? null,
    type: type ?? null,
    status: status ?? "active",
  };

  Notification.create(notification)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Notification.",
      })
    );
};

// Read all
exports.findAll = (req, res) => {
  const { departmentID, status, type } = req.query;

  const where = {};
  if (departmentID) where.departmentID = departmentID;
  if (status) where.status = status;
  if (type) where.type = type;

  Notification.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving notifications.",
      })
    );
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;

  Notification.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find Notification with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({ message: "Error retrieving Notification with ID=" + id })
    );
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  Notification.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "Notification updated successfully." });
      else {
        res.send({
          message: `Cannot update Notification with ID=${id}. Maybe not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Error updating Notification with ID=" + id })
    );
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;

  Notification.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Notification deleted successfully!" });
      else res.send({ message: `Cannot delete Notification with ID=${id}. Maybe not found!` });
    })
    .catch(() =>
      res.status(500).send({ message: "Could not delete Notification with ID=" + id })
    );
};

export default exports;