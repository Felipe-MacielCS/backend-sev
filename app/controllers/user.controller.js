import db from "../models/index.js";
const User = db.user;
const Op = db.Sequelize.Op;
const exportsObj = {};

// Create and Save a new User
exportsObj.create = (req, res) => {
  if (!req.body.name || !req.body.email) {
    res.status(400).send({ message: "Name and email are required!" });
    return;
  }

  const user = {
    name: req.body.name,
    email: req.body.email,
    isAdmin: req.body.isAdmin || false,
  };

  User.create(user)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      })
    );
};

// Retrieve all users
exportsObj.findAll = (req, res) => {
  const name = req.query.name;
  const condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  User.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      })
    );
};

// Find a single User by ID
exportsObj.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find User with id=${id}.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving User with id=" + id })
    );
};

// Find a single User by email
exportsObj.findByEmail = (req, res) => {
  const email = req.params.email;

  User.findOne({ where: { email } })
    .then((data) => {
      if (data) res.send(data);
      else res.send({ email: "not found" });
    })
    .catch((err) =>
      res
        .status(500)
        .send({ message: "Error retrieving User with email=" + email })
    );
};

// Update a User by ID
exportsObj.update = (req, res) => {
  const id = req.params.id;

  User.update(req.body, { where: { userID: id } })
    .then((num) => {
      if (num == 1) res.send({ message: "User was updated successfully." });
      else
        res.send({
          message: `Cannot update User with id=${id}. Maybe not found or req.body is empty!`,
        });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error updating User with id=" + id })
    );
};

// Delete a User
exportsObj.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({ where: { userID: id } })
    .then((num) => {
      if (num == 1) res.send({ message: "User was deleted successfully!" });
      else
        res.send({
          message: `Cannot delete User with id=${id}. Maybe not found!`,
        });
    })
    .catch((err) =>
      res.status(500).send({ message: "Could not delete User with id=" + id })
    );
};

// Promote or demote user to admin
exportsObj.setAdmin = (req, res) => {
  const id = req.params.id;
  const { isAdmin } = req.body;

  User.update({ isAdmin }, { where: { userID: id } })
    .then((num) => {
      if (num == 1) res.send({ message: "Admin status updated successfully." });
      else res.send({ message: `Cannot update admin status for id=${id}.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error updating admin status." })
    );
};

export default exportsObj;