import db from "../models/index.js";
const Settings = db.settings;
const Op = db.Sequelize.Op;

const exports = {};

exports.create = async (req, res) => {
  try {
    if (!req.body.key) {
      return res.status(400).send({ 
        message: "Setting key is required!" 
      });
    }

    if (!req.body.name) {
      return res.status(400).send({ 
        message: "Setting name is required!" 
      });
    }

    const existingSetting = await Settings.findOne({
      where: { key: req.body.key }
    });

    if (existingSetting) {
      return res.status(409).send({ 
        message: `Setting with key "${req.body.key}" already exists!` 
      });
    }

    const setting = {
      key: req.body.key,
      name: req.body.name,
      description: req.body.description || null,
      value_default: req.body.value_default || null,
      active: req.body.active !== undefined ? req.body.active : true
    };

    const data = await Settings.create(setting);
    
    res.status(201).send({
      message: "Setting created successfully!",
      data: data
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Setting."
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { active, key, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (active !== undefined) {
      where.active = active === 'true';
    }

    if (key) {
      where.key = { [Op.like]: `%${key}%` };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Settings.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.send({
      totalItems: count,
      settings: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving settings."
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const settingID = req.params.id;

    const data = await Settings.findByPk(settingID);

    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `Setting with ID=${settingID} not found.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Setting with ID=${req.params.id}`
    });
  }
};

exports.update = async (req, res) => {
  try {
    const settingID = req.params.id;

    const setting = await Settings.findByPk(settingID);
    if (!setting) {
      return res.status(404).send({
        message: `Setting with ID=${settingID} not found.`
      });
    }

    if (req.body.key && req.body.key !== setting.key) {
      const existingSetting = await Settings.findOne({
        where: {
          key: req.body.key,
          ID: { [Op.ne]: settingID }
        }
      });

      if (existingSetting) {
        return res.status(409).send({ 
          message: `Setting with key "${req.body.key}" already exists!` 
        });
      }
    }

    delete req.body.ID;

    const [num] = await Settings.update(req.body, { 
      where: { ID: settingID } 
    });

    if (num === 1) {
      const updatedData = await Settings.findByPk(settingID);
      res.send({
        message: "Setting updated successfully.",
        data: updatedData
      });
    } else {
      res.send({
        message: `Cannot update Setting with ID=${settingID}. No changes were made.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error updating Setting with ID=${req.params.id}`
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const settingID = req.params.id;

    const num = await Settings.destroy({ 
      where: { ID: settingID } 
    });

    if (num === 1) {
      res.send({
        message: "Setting deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete Setting with ID=${settingID}. Maybe it was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Could not delete Setting with ID=${req.params.id}`
    });
  }
};

export default exports;