import db from "../models/index.js";
const Goal = db.goal;
const Op = db.Sequelize.Op;

const exports = {};

exports.create = (req, res) => {
  if (!req.body.type || !req.body.target || !req.body.athleteID || !req.body.exerciseID) {
    res.status(400).send({ message: "Type, Target, Athlete ID, and Exercise ID cannot be empty!" });
    return;
  }

  const goal = {
    type: req.body.type,
    target: req.body.target,
    metric: req.body.metric,
    deadline: req.body.deadline,
    status: req.body.status,
    athleteID: req.body.athleteID,
    exerciseID: req.body.exerciseID,
  };

  Goal.create(goal)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Goal.",
      })
    );
};

exports.findAll = (req, res) => {
  const athleteID = req.query.athleteID;
  const status = req.query.status;
  
  let condition = null;
  if (athleteID) {
    condition = { athleteID: athleteID };
  } else if (status) {
    condition = { status: status };
  }

  Goal.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving goals.",
      })
    );
};

exports.findOne = (req, res) => {
  const goalID = req.params.id;

  Goal.findByPk(goalID)
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({
          message: `Cannot find Goal with goalID=${goalID}.`,
        });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving Goal with goalID=" + goalID,
      })
    );
};

exports.update = (req, res) => {
  const goalID = req.params.id;

  Goal.update(req.body, { where: { goalID: goalID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Goal updated successfully." });
      } else {
        res.send({
          message: `Cannot update Goal with goalID=${goalID}. Maybe it was not found or request body is empty!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating Goal with goalID=" + goalID,
      })
    );
};

exports.delete = (req, res) => {
  const goalID = req.params.id;

  Goal.destroy({ where: { goalID: goalID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Goal deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete Goal with goalID=${goalID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete Goal with goalID=" + goalID,
      })
    );
};

export default exports;