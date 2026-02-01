import db from "../models/index.js";
const ExercisePool = db.exercisepool;

const exports = {};

exports.create = (req, res) => {
  if (!req.body.exerciseID || !req.body.planID) {
    res.status(400).send({ message: "Exercise ID and Plan ID cannot be empty!" });
    return;
  }

  const exercisepool = {
    exerciseID: req.body.exerciseID,
    planID: req.body.planID,
    order: req.body.order,
    repetitions: req.body.repetitions,
    sets: req.body.sets,
  };

  ExercisePool.create(exercisepool)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the ExercisePool entry.",
      })
    );
};

exports.findAll = (req, res) => {
  const planID = req.query.planID;
  const condition = planID ? { planID: planID } : null;

  ExercisePool.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving exercisepool entries.",
      })
    );
};

exports.findOne = (req, res) => {
  const exerciseID = req.params.exerciseID;
  const planID = req.params.planID;

  ExercisePool.findOne({ where: { exerciseID: exerciseID, planID: planID } })
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({
          message: `Cannot find ExercisePool with exerciseID=${exerciseID} and planID=${planID}.`,
        });
    })
    .catch((err) =>
      res.status(500).send({
        message: `Error retrieving ExercisePool with exerciseID=${exerciseID} and planID=${planID}`,
      })
    );
};

exports.update = (req, res) => {
  const exerciseID = req.params.exerciseID;
  const planID = req.params.planID;

  ExercisePool.update(req.body, { where: { exerciseID: exerciseID, planID: planID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "ExercisePool updated successfully." });
      } else {
        res.send({
          message: `Cannot update ExercisePool with exerciseID=${exerciseID} and planID=${planID}. Maybe it was not found or request body is empty!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: `Error updating ExercisePool with exerciseID=${exerciseID} and planID=${planID}`,
      })
    );
};

exports.delete = (req, res) => {
  const exerciseID = req.params.exerciseID;
  const planID = req.params.planID;

  ExercisePool.destroy({ where: { exerciseID: exerciseID, planID: planID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "ExercisePool deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete ExercisePool with exerciseID=${exerciseID} and planID=${planID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: `Could not delete ExercisePool with exerciseID=${exerciseID} and planID=${planID}`,
      })
    );
};

export default exports;