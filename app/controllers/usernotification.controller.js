import db from "../models/index.js";
const UserNotification = db.usernotification;

const exports = {};

// Create
exports.create = (req, res) => {
  const { userID, notificationID, status } = req.body;

  if (!userID || !notificationID) {
    res.status(400).send({ message: "userID and notificationID are required." });
    return;
  }

  const record = {
    userID,
    notificationID,
    status: status ?? "unread",
  };

  UserNotification.create(record)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the UserNotification.",
      })
    );
};

// Read all
exports.findAll = (req, res) => {
  const { userID, notificationID, status } = req.query;

  const where = {};
  if (userID) where.userID = userID;
  if (notificationID) where.notificationID = notificationID;
  if (status) where.status = status;

  UserNotification.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving user notifications.",
      })
    );
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;

  UserNotification.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else
        res
          .status(404)
          .send({ message: `Cannot find UserNotification with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({
        message: "Error retrieving UserNotification with ID=" + id,
      })
    );
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  UserNotification.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1)
        res.send({ message: "UserNotification updated successfully." });
      else {
        res.send({
          message: `Cannot update UserNotification with ID=${id}. Maybe not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({
        message: "Error updating UserNotification with ID=" + id,
      })
    );
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;

  UserNotification.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "UserNotification deleted successfully!" });
      else {
        res.send({
          message: `Cannot delete UserNotification with ID=${id}. Maybe it was not found!`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({
        message: "Could not delete UserNotification with ID=" + id,
      })
    );
};

export default exports;