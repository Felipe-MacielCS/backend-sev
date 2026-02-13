import db from "../models/index.js";
const User = db.user;

const exports = {};

// Create a new user
exports.create = (req, res) => {
  const { name, email, phone, status } = req.body;

  if (!name || !email) {
    res.status(400).send({ message: "name and email are required." });
    return;
  }

  const user = {
    name,
    email,
    phone: phone ?? null,
    status: status ?? "active",
  };

  User.create(user)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      })
    );
};

// Get all users (optionally filter by status or email)
exports.findAll = (req, res) => {
  const { status, email } = req.query;

  const where = {};
  if (status) where.status = status;
  if (email) where.email = email;

  User.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      })
    );
};

// Get one user by primary key
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find User with ID=${id}.` });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving User with ID=" + id,
      })
    );
};

// Update a user by primary key
exports.update = (req, res) => {
  const id = req.params.id;
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  User.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "User updated successfully." });
      else {
        res.send({
          message: `Cannot update User with ID=${id}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating User with ID=" + id,
      })
    );
};

// Delete a user by primary key
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "User deleted successfully!" });
      else {
        res.send({
          message: `Cannot delete User with ID=${id}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete User with ID=" + id,
      })
    );
};

export default exports;
