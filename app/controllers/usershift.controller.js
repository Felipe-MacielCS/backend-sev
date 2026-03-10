import db from "../models/index.js";
const UserShift = db.usershift;

const exports = {};

// Assign a user to a shift
exports.create = (req, res) => {
  const { status, shiftID, userID } = req.body;

  if (!shiftID || !userID) {
    res.status(400).send({ message: "shiftID and userID are required." });
    return;
  }

  const userShift = {
    status: status ?? "assigned",
    shiftID,
    userID,
  };

  UserShift.create(userShift)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the UserShift.",
      })
    );
};

// Find all userShift assignments
exports.findAll = (req, res) => {
  const { userID, shiftID, status } = req.query;

  const where = {};
  if (userID) where.userID = userID;
  if (shiftID) where.shiftID = shiftID;
  if (status) where.status = status;

  UserShift.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving user shifts.",
      })
    );
};

// Find one by ID
exports.findOne = (req, res) => {
  const id = req.params.id;

  UserShift.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else
        res
          .status(404)
          .send({ message: `Cannot find UserShift with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({ message: "Error retrieving UserShift with ID=" + id })
    );
};

// Update by ID
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  UserShift.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "UserShift updated successfully." });
      else {
        res.send({
          message: `Cannot update UserShift with ID=${id}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Error updating UserShift with ID=" + id })
    );
};

// Delete by ID
exports.delete = (req, res) => {
  const id = req.params.id;

  UserShift.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "UserShift deleted successfully!" });
      else {
        res.send({
          message: `Cannot delete UserShift with ID=${id}. Maybe it was not found!`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Could not delete UserShift with ID=" + id })
    );
};

export default exports;
