import db from "../models/index.js";
const User = db.user;

const exports = {};

// Create a new user with a specific role
exports.create = (req, res) => {
  const { name, email, phone, status, role } = req.body;

  if (!name || !email) {
    res.status(400).send({ message: "name and email are required." });
    return;
  }

  const user = {
    name,
    email,
    phone: phone ?? null,
    status: status ?? "active",
    role: role ?? "Worker", // Support for the new consolidated role attribute
  };

  User.create(user)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      })
    );
};

// Get all users (optionally filter by status, email, or role)
exports.findAll = (req, res) => {
  const { status, email, role } = req.query;

  const where = {};
  if (status) where.status = status;
  if (email) where.email = email;
  if (role) where.role = role;

  User.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      })
    );
};

// Get one user by userID
exports.findOne = (req, res) => {
  const userID = req.params.id;

  User.findByPk(userID)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find User with userID=${userID}.` });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving User with userID=" + userID,
      })
    );
};

// Update a user by userID
exports.update = (req, res) => {
  const userID = req.params.id;
  
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  // Use userID in the where clause to match standardized model PK
  User.update(req.body, { where: { userID: userID } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "User updated successfully." });
      else {
        res.send({
          message: `Cannot update User with userID=${userID}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating User with userID=" + userID,
      })
    );
};

// Delete a user by userID
exports.delete = (req, res) => {
  const userID = req.params.id;

  User.destroy({ where: { userID: userID } })
    .then((num) => {
      if (num === 1) res.send({ message: "User deleted successfully!" });
      else {
        res.send({
          message: `Cannot delete User with userID=${userID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete User with userID=" + userID,
      })
    );
};

export default exports;