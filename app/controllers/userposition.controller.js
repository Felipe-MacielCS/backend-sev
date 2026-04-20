import db from "../models/index.js";

const UserPosition = db.userposition;
const User = db.user;
const Position = db.position;

const exports = {};

exports.create = async (req, res) => {
  try {
    const { userID, positionID } = req.body;

    if (!userID || !positionID) {
      return res.status(400).send({ message: "userID and positionID are required." });
    }

    const [user, position] = await Promise.all([
      User.findByPk(userID),
      Position.findByPk(positionID),
    ]);

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    if (!position) {
      return res.status(404).send({ message: "Position not found." });
    }

    const existing = await UserPosition.findOne({ where: { userID, positionID } });
    if (existing) {
      return res.status(409).send({ message: "This user already has that position assigned." });
    }

    const assignment = await UserPosition.create({ userID, positionID });
    return res.status(201).send(assignment);
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the user position assignment.",
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { userID, positionID } = req.query;
    const where = {};

    if (userID) where.userID = userID;
    if (positionID) where.positionID = positionID;

    const assignments = await UserPosition.findAll({ where });
    return res.send({ userpositions: assignments });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving user position assignments.",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const assignment = await UserPosition.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).send({ message: `Cannot find UserPosition with ID=${req.params.id}.` });
    }

    return res.send(assignment);
  } catch (err) {
    return res.status(500).send({
      message: err.message || `Error retrieving UserPosition with ID=${req.params.id}.`,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await UserPosition.destroy({ where: { ID: req.params.id } });
    if (deleted === 1) {
      return res.send({ message: "UserPosition deleted successfully!" });
    }

    return res.status(404).send({
      message: `Cannot delete UserPosition with ID=${req.params.id}. Maybe it was not found!`,
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || `Could not delete UserPosition with ID=${req.params.id}.`,
    });
  }
};

exports.deleteByPair = async (req, res) => {
  try {
    const { userID, positionID } = req.query;

    if (!userID || !positionID) {
      return res.status(400).send({ message: "userID and positionID are required." });
    }

    const deleted = await UserPosition.destroy({ where: { userID, positionID } });
    if (deleted > 0) {
      return res.send({ message: "UserPosition deleted successfully!" });
    }

    return res.status(404).send({
      message: "Cannot delete UserPosition. Matching assignment was not found.",
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Could not delete UserPosition.",
    });
  }
};

export default exports;
