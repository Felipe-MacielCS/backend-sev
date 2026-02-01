import db from "../models/index.js";
const CoachAthlete = db.coachathlete;

const exportsObj = {};

exportsObj.create = (req, res) => {
  const { coachID, athleteID } = req.body;

  if (!coachID || !athleteID) {
    return res.status(400).send({
      message: "coachID and athleteID are required.",
    });
  }

  const row = { coachID, athleteID };

  CoachAthlete.create(row)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while creating CoachAthlete assignment.",
      })
    );
};

exportsObj.findAll = (req, res) => {
  const coachID = req.query.coachID;
  const where = coachID ? { coachID } : undefined;

  CoachAthlete.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while retrieving CoachAthlete rows.",
      })
    );
};

exportsObj.delete = (req, res) => {
  const { coachID, athleteID } = req.params;

  CoachAthlete.destroy({ where: { coachID, athleteID } })
    .then((num) => {
      if (num === 1) {
        res.send({ message: "CoachAthlete deleted successfully!" });
      } else {
        res.send({
          message:
            "Cannot delete CoachAthlete. Maybe it was not found with the given coachID/athleteID.",
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message:
          err.message ||
          "Could not delete CoachAthlete with the given coachID/athleteID.",
      })
    );
};

export default exportsObj;
