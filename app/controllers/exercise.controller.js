import db from "../models/index.js";
const Exercise = db.exercise;
const Op = db.Sequelize.Op;

const exports = {};

exports.create = (req, res) => {
  if (!req.body.name) {
    res.status(400).send({ message: "Name cannot be empty!" });
    return;
  }

  const exercise = {
    name: req.body.name,
    equipment: req.body.equipment,
    description: req.body.description,
    muscle_group: req.body.muscle_group,
  };

  Exercise.create(exercise)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Exercise.",
      })
    );
};

exports.findAll = (req, res) => {
  const name = req.query.name;
  const muscle_group = req.query.muscle_group;
  
  let condition = null;
  if (name) {
    condition = { name: { [Op.like]: `%${name}%` } };
  } else if (muscle_group) {
    condition = { muscle_group: { [Op.like]: `%${muscle_group}%` } };
  }

  Exercise.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving exercises.",
      })
    );
};

exports.findOne = (req, res) => {
  const exerciseID = req.params.id;

  Exercise.findByPk(exerciseID)
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({
          message: `Cannot find Exercise with exerciseID=${exerciseID}.`,
        });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving Exercise with exerciseID=" + exerciseID,
      })
    );
};

exports.update = (req, res) => {
  const exerciseID = req.params.id;

  Exercise.update(req.body, { where: { exerciseID: exerciseID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Exercise updated successfully." });
      } else {
        res.send({
          message: `Cannot update Exercise with exerciseID=${exerciseID}. Maybe it was not found or request body is empty!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating Exercise with exerciseID=" + exerciseID,
      })
    );
};

exports.delete = (req, res) => {
  const exerciseID = req.params.id;

  Exercise.destroy({ where: { exerciseID: exerciseID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Exercise deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete Exercise with exerciseID=${exerciseID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete Exercise with exerciseID=" + exerciseID,
      })
    );
};

export default exports;
