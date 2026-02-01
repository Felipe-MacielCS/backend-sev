import db from "../models/index.js";
const Coach = db.coach;

const exports = {};

exports.create = (req, res) => {
  if (!req.body.userID) {
    res.status(400).send({ message: "User ID cannot be empty!" });
    return;
  }

  const coach = { userID: req.body.userID };

  Coach.create(coach)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Coach.",
      })
    );
};

exports.findAll = (req, res) => {
  Coach.findAll({
    include: [
      {
        model: db.user,
        attributes: ["userID", "name", "email", "isAdmin"],
      },
    ],
  })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving coaches.",
      })
    );
};


exports.findOne = (req, res) => {
  const coachID = req.params.id;

  Coach.findByPk(coachID, {
    include: [
      {
        model: db.user,
        attributes: ["userID", "name", "email", "isAdmin"],
      },
    ],
  })
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({
          message: `Cannot find Coach with coachID=${coachID}.`,
        });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving Coach with coachID=" + coachID,
      })
    );
};


exports.update = (req, res) => {
  const coachID = req.params.id;

  Coach.update(req.body, { where: { coachID: coachID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Coach updated successfully." });
      } else {
        res.send({
          message: `Cannot update Coach with coachID=${coachID}. Maybe it was not found or request body is empty!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating Coach with coachID=" + coachID,
      })
    );
};

exports.delete = (req, res) => {
  const coachID = req.params.id;

  Coach.destroy({ where: { coachID: coachID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Coach deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete Coach with coachID=${coachID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete Coach with coachID=" + coachID,
      })
    );
};

export default exports;