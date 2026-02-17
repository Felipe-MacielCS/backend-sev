import db from "../models/index.js";
const Department = db.department;
const Op = db.Sequelize.Op;

const exports = {};

// Create a new Department
exports.create = (req, res) => {
  if (!req.body.name) {
    res.status(400).send({ message: "Department name cannot be empty!" });
    return;
  }

  const department = {
    name: req.body.name,
    location: req.body.location,
    phone: req.body.phone,
    email: req.body.email,
  };

  Department.create(department)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Department.",
      })
    );
};

// Retrieve all Departments
exports.findAll = (req, res) => {
  const name = req.query.name;
  let condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Department.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving departments.",
      })
    );
};

// Find a single Department by departmentID
exports.findOne = (req, res) => {
  const departmentID = req.params.id; // Using id from URL but mapping to departmentID

  Department.findByPk(departmentID)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find Department with departmentID=${departmentID}.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving Department with departmentID=" + departmentID })
    );
};

// Update a Department
exports.update = (req, res) => {
  const departmentID = req.params.id;

  Department.update(req.body, { where: { departmentID: departmentID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Department updated successfully." });
      } else {
        res.send({ message: `Cannot update Department with departmentID=${departmentID}.` });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: "Error updating Department with departmentID=" + departmentID })
    );
};

// Delete a Department
exports.delete = (req, res) => {
  const departmentID = req.params.id;

  Department.destroy({ where: { departmentID: departmentID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Department deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete Department with departmentID=${departmentID}.` });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: "Could not delete Department with departmentID=" + departmentID })
    );
};

export default exports;