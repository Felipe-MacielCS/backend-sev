import db from "../models/index.js";
const ExercisePlan = db.exerciseplan;
const Op = db.Sequelize.Op;

const exports = {};

exports.create = (req, res) => {
  if (!req.body.name || !req.body.coachID) {
    res.status(400).send({ message: "Name and Coach ID cannot be empty!" });
    return;
  }

  const exerciseplan = {
    name: req.body.name,
    description: req.body.description,
    coachID: req.body.coachID,
  };

  ExercisePlan.create(exerciseplan)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the ExercisePlan.",
      })
    );
};

exports.findAll = (req, res) => {
  const name = req.query.name;
  const coachID = req.query.coachID;
  
  let condition = null;
  if (name) {
    condition = { name: { [Op.like]: `%${name}%` } };
  } else if (coachID) {
    condition = { coachID: coachID };
  }

  ExercisePlan.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving exerciseplans.",
      })
    );
};

exports.findOne = (req, res) => {
  const planID = req.params.id;

  ExercisePlan.findByPk(planID)
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({
          message: `Cannot find ExercisePlan with planID=${planID}.`,
        });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving ExercisePlan with planID=" + planID,
      })
    );
};

exports.update = (req, res) => {
  const planID = req.params.id;

  ExercisePlan.update(req.body, { where: { planID: planID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "ExercisePlan updated successfully." });
      } else {
        res.send({
          message: `Cannot update ExercisePlan with planID=${planID}. Maybe it was not found or request body is empty!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating ExercisePlan with planID=" + planID,
      })
    );
};

exports.delete = (req, res) => {
  const planID = req.params.id;

  ExercisePlan.destroy({ where: { planID: planID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "ExercisePlan deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete ExercisePlan with planID=${planID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete ExercisePlan with planID=" + planID,
      })
    );
};

export default exports;