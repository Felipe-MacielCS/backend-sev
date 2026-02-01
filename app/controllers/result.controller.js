import db from "../models/index.js";
const Result = db.result;
const Op = db.Sequelize.Op;

const exports = {};

// Create and Save a new Result
exports.create = (req, res) => {
  if (!req.body.goalID) {
    res.status(400).send({ message: "Goal ID cannot be empty!" });
    return;
  }

  const result = {
    goalID: req.body.goalID,
    recordDate: req.body.recordDate,
    value: req.body.value,
    notes: req.body.notes,
  };

  Result.create(result)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Result.",
      })
    );
};

// Retrieve all Results (optional filtering by goalID)
exports.findAll = (req, res) => {
  const goalID = req.query.goalID;
  const condition = goalID ? { goalID: { [Op.eq]: goalID } } : null;

  Result.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving results.",
      })
    );
};

// Retrieve a single Result by resultID
exports.findOne = (req, res) => {
  const resultID = req.params.id;

  Result.findByPk(resultID)
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({
          message: `Cannot find Result with resultID=${resultID}.`,
        });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving Result with resultID=" + resultID,
      })
    );
};

// Update a Result by resultID
exports.update = (req, res) => {
  const resultID = req.params.id;

  Result.update(req.body, { where: { resultID: resultID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Result updated successfully." });
      } else {
        res.send({
          message: `Cannot update Result with resultID=${resultID}. Maybe it was not found or request body is empty!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating Result with resultID=" + resultID,
      })
    );
};

// Delete a Result by resultID
exports.delete = (req, res) => {
  const resultID = req.params.id;

  Result.destroy({ where: { resultID: resultID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Result deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete Result with resultID=${resultID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete Result with resultID=" + resultID,
      })
    );
};

export default exports;
