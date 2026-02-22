import db from "../models/index.js";
const Settings = db.settings;

const exports = {};

// Create
exports.create = (req, res) => {
  const { key, label, value_type, default_value, description, is_active } = req.body;

  if (!key || !value_type) {
    res.status(400).send({ message: "key and value_type are required." });
    return;
  }

  const setting = {
    key,
    label: label ?? null,
    value_type,
    default_value: default_value ?? null,
    description: description ?? null,
    is_active: is_active ?? true,
  };

  Settings.create(setting)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Setting.",
      })
    );
};

// Read all
exports.findAll = (req, res) => {
  const { key, is_active } = req.query;

  const where = {};
  if (key) where.key = key;
  if (is_active !== undefined) where.is_active = is_active === "true";

  Settings.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving settings.",
      })
    );
};

// Read one
exports.findOne = (req, res) => {
  const id = req.params.id;

  Settings.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find Setting with ID=${id}.` });
    })
    .catch(() =>
      res.status(500).send({ message: "Error retrieving Setting with ID=" + id })
    );
};

// Update
exports.update = (req, res) => {
  const id = req.params.id;

  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  Settings.update(req.body, { where: { ID: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "Setting updated successfully." });
      else {
        res.send({
          message: `Cannot update Setting with ID=${id}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch(() =>
      res.status(500).send({ message: "Error updating Setting with ID=" + id })
    );
};

// Delete
exports.delete = (req, res) => {
  const id = req.params.id;

  Settings.destroy({ where: { ID: id } })
    .then((num) => {
      if (num === 1) res.send({ message: "Setting deleted successfully!" });
      else res.send({ message: `Cannot delete Setting with ID=${id}. Maybe it was not found!` });
    })
    .catch(() =>
      res.status(500).send({ message: "Could not delete Setting with ID=" + id })
    );
};

export default exports;