import db from "../models/index.js";
const Athlete = db.athlete;
const Op = db.Sequelize.Op;

const exports = {};

exports.create = (req, res) => {
  if (!req.body.userID) {
    res.status(400).send({ message: "User ID cannot be empty!" });
    return;
  }

  const athlete = {
    userID: req.body.userID,
    weight: req.body.weight,
    height: req.body.height,
    sport: req.body.sport,
    age: req.body.age,
  };

  Athlete.create(athlete)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Athlete.",
      })
    );
};

exports.findAll = async (req, res) => {
  const sport = req.query.sport;
  const condition = sport ? { sport: { [Op.like]: `%${sport}%` } } : undefined;

  try {
    const athletes = await Athlete.findAll({
      where: condition,
      include: [
        {
          model: db.user, 
          attributes: ["userID", "name", "email", "isAdmin"],
        },
      ],
    });

    res.status(200).send(athletes);
  } catch (err) {
    console.error(" Error retrieving athletes:", err);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving athletes.",
    });
  }
};

exports.findOne = (req, res) => {
  const athleteID = req.params.id;

  Athlete.findByPk(athleteID)
    .then((data) => {
      if (data) res.send(data);
      else
        res.status(404).send({
          message: `Cannot find Athlete with athleteID=${athleteID}.`,
        });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving Athlete with athleteID=" + athleteID,
      })
    );
};

exports.update = (req, res) => {
  const athleteID = req.params.id;

  Athlete.update(req.body, { where: { athleteID: athleteID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Athlete updated successfully." });
      } else {
        res.send({
          message: `Cannot update Athlete with athleteID=${athleteID}. Maybe it was not found or request body is empty!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating Athlete with athleteID=" + athleteID,
      })
    );
};

exports.delete = (req, res) => {
  const athleteID = req.params.id;

  Athlete.destroy({ where: { athleteID: athleteID } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Athlete deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete Athlete with athleteID=${athleteID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Could not delete Athlete with athleteID=" + athleteID,
      })
    );
};

export default exports;
