import db from "../models/index.js";
const DepartmentUser = db.departmentUser;
const Op = db.Sequelize.Op;

const exports = {};

// Assign a user to a department
exports.create = (req, res) => {
  if (!req.body.userID || !req.body.departmentID || !req.body.role) {
    res.status(400).send({ message: "User ID, Department ID, and Role are required!" });
    return;
  }

  const deptUser = {
    userID: req.body.userID,
    departmentID: req.body.departmentID,
    role: req.body.role,
  };

  DepartmentUser.create(deptUser)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error occurred while creating the DepartmentUser entry.",
      })
    );
};

// Find all assignments (can filter by departmentID or userID)
exports.findAll = (req, res) => {
  const departmentID = req.query.departmentID;
  const userID = req.query.userID;
  
  let condition = {};
  if (departmentID) condition.departmentID = departmentID;
  if (userID) condition.userID = userID;

  DepartmentUser.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error retrieving DepartmentUser entries.",
      })
    );
};

// Find one specific assignment
exports.findOne = (req, res) => {
  const id = req.params.id;

  DepartmentUser.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Assignment with id=${id} not found.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving assignment with id=" + id })
    );
};

// Update an assignment (e.g., change a user's role)
exports.update = (req, res) => {
  const id = req.params.id;

  DepartmentUser.update(req.body, { where: { departmentUserID: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Assignment updated successfully." });
      } else {
        res.send({ message: `Cannot update assignment with id=${id}.` });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: "Error updating assignment with id=" + id })
    );
};

// Remove a user from a department
exports.delete = (req, res) => {
  const id = req.params.id;

  DepartmentUser.destroy({ where: { departmentUserID: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "User removed from department successfully!" });
      } else {
        res.send({ message: `Cannot delete assignment with id=${id}.` });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: "Could not delete assignment with id=" + id })
    );
};

export default exports;