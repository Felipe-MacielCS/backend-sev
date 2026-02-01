
import db from "../models/index.js";
const PlanAssignment = db.planassignment;

const exportsObj = {};

exportsObj.create = (req, res) => {
  const { planID, athleteID } = req.body;
  if (!planID || !athleteID) {
    return res
      .status(400)
      .send({ message: "planID and athleteID are required." });
  }

  PlanAssignment.create({ planID, athleteID })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while creating the PlanAssignment.",
      })
    );
};

exportsObj.findAll = (req, res) => {
  const { planID, athleteID } = req.query;
  const where = {};
  if (planID) where.planID = planID;
  if (athleteID) where.athleteID = athleteID;

  PlanAssignment.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while retrieving PlanAssignments.",
      })
    );
};

exportsObj.delete = (req, res) => {
  const { planID, athleteID } = req.params;

  PlanAssignment.destroy({ where: { planID, athleteID } })
    .then((num) => {
      if (num === 1) {
        res.send({ message: "PlanAssignment deleted successfully." });
      } else {
        res.send({
          message: `Cannot delete PlanAssignment with planID=${planID} and athleteID=${athleteID}. Maybe it was not found!`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: `Could not delete PlanAssignment with planID=${planID} and athleteID=${athleteID}`,
      })
    );
};

export default exportsObj;
