import db from "../models/index.js";
const SettingsValues = db.settingsvalues;

const exports = {};

// Create
exports.create = (req, res) => {
  const { settingID, userID, departmentID, value } = req.body;

  if (!settingID || value === undefined) {
    res.status(400).send({ message: "settingID and value are required." });
    return;
  }

  const hasUser = userID !== null && userID !== undefined;
  const hasDept = departmentID !== null && departmentID !== undefined;

  if (hasUser && hasDept) {
    res.status(400).send({ message: "Provide only one: userID OR departmentID." });
    return;
  }
  if (!hasUser && !hasDept) {
    res.status(400).send({ message: "You must provide userID or departmentID." });
    return;
  }

  const overrideRow = {
    settingID,
    userID: hasUser ? userID : null,
    departmentID: hasDept ? departmentID : null,
    value,
  };

  SettingsValues.create(overrideRow)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(400).send({
        message: err.message || "Some error occurred while creating the SettingsValue.",
      })
    );
};

// Read all
exports.findAll = (req, res) => {
  const { settingID, userID, departmentID } = req.query;

  const where = {};
  if (settingID) where.settingID = settingID;
  if (userID) where.userID = userID;
  if (departmentID) where.departmentID = departmentID;

  SettingsValues.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving settings values.",
      })
    );
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;

  SettingsValues.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find SettingsValue with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({ message: "Error retrieving SettingsValue with ID=" + id })
    );
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  // Optional: prevent invalid scope updates
  if ("userID" in req.body || "departmentID" in req.body) {
    const nextUser = req.body.userID;
    const nextDept = req.body.departmentID;

    const hasUser = nextUser !== null && nextUser !== undefined;
    const hasDept = nextDept !== null && nextDept !== undefined;

    if (hasUser && hasDept) {
      res.status(400).send({ message: "Provide only one: userID OR departmentID." });
      return;
    }
    if (!hasUser && !hasDept && ("userID" in req.body || "departmentID" in req.body)) {
      // if they tried to set both to null/undefined
      res.status(400).send({ message: "You must provide userID or departmentID." });
      return;
    }
  }

  SettingsValues.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "SettingsValue updated successfully." });
      else {
        res.send({
          message: `Cannot update SettingsValue with ID=${id}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch((err) =>
      res.status(400).send({
        message: err.message || "Error updating SettingsValue with ID=" + id,
      })
    );
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;

  SettingsValues.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "SettingsValue deleted successfully!" });
      else res.send({ message: `Cannot delete SettingsValue with ID=${id}. Maybe it was not found!` });
    })
    .catch(() =>
      res.status(500).send({ message: "Could not delete SettingsValue with ID=" + id })
    );
};

export default exports;