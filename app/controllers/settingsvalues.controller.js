import db from "../models/index.js";
const SettingsValues = db.settingsvalues;
const Settings = db.settings;

const exports = {};
const LOCKED_USER_SETTING_KEYS = new Set(["oc_student_id"]);

const getSettingForRow = async (settingID) => {
  if (!settingID) return null;
  return Settings.findByPk(settingID);
};

const isLockedUserSetting = (setting) =>
  LOCKED_USER_SETTING_KEYS.has(String(setting?.key || "").trim().toLowerCase());

// Create
exports.create = async (req, res) => {
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

  try {
    const setting = await getSettingForRow(settingID);
    if (!setting) {
      return res.status(404).send({ message: "Setting not found." });
    }

    const normalizedValue = String(value ?? "").trim();
    if (hasUser && isLockedUserSetting(setting)) {
      const existing = await SettingsValues.findOne({
        where: {
          settingID,
          userID,
        },
      });

      if (existing) {
        if (String(existing.value ?? "").trim() === normalizedValue) {
          return res.send(existing);
        }
        return res.status(409).send({
          message: "This student ID is locked and cannot be changed once saved.",
        });
      }
    }

    const overrideRow = {
      settingID,
      userID: hasUser ? userID : null,
      departmentID: hasDept ? departmentID : null,
      value,
    };

    const data = await SettingsValues.create(overrideRow);
    return res.send(data);
  } catch (err) {
    return res.status(400).send({
      message: err.message || "Some error occurred while creating the SettingsValue.",
    });
  }
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
exports.update = async (req, res) => {
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

  try {
    const existingRow = await SettingsValues.findByPk(id);
    if (!existingRow) {
      return res.status(404).send({
        message: `Cannot find SettingsValue with ID=${id}.`,
      });
    }

    const setting = await getSettingForRow(existingRow.settingID);
    if (existingRow.userID && isLockedUserSetting(setting)) {
      const incomingValue =
        "value" in req.body ? String(req.body.value ?? "").trim() : String(existingRow.value ?? "").trim();
      const existingValue = String(existingRow.value ?? "").trim();
      if (incomingValue !== existingValue) {
        return res.status(409).send({
          message: "This student ID is locked and cannot be changed once saved.",
        });
      }
    }

    const num = await SettingsValues.update(req.body, { where: { ID: id } });
    const affected = Array.isArray(num) ? num[0] : num;

    if (affected === 1) return res.send({ message: "SettingsValue updated successfully." });

    return res.send({
      message: `Cannot update SettingsValue with ID=${id}. Maybe it was not found or nothing changed.`,
    });
  } catch (err) {
    return res.status(400).send({
      message: err.message || "Error updating SettingsValue with ID=" + id,
    });
  }
};

// Delete
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const existingRow = await SettingsValues.findByPk(id);
    if (!existingRow) {
      return res.send({ message: `Cannot delete SettingsValue with ID=${id}. Maybe it was not found!` });
    }

    const setting = await getSettingForRow(existingRow.settingID);
    if (existingRow.userID && isLockedUserSetting(setting)) {
      return res.status(409).send({
        message: "This student ID is locked and cannot be removed once saved.",
      });
    }

    const num = await SettingsValues.destroy({ where: { ID: id } });
    if (num === 1) return res.send({ message: "SettingsValue deleted successfully!" });
    return res.send({ message: `Cannot delete SettingsValue with ID=${id}. Maybe it was not found!` });
  } catch {
    return res.status(500).send({ message: "Could not delete SettingsValue with ID=" + id });
  }
};

export default exports;
