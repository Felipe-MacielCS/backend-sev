import db from "../models/index.js";
const Position = db.position;
const User = db.user;
const Department = db.department;

const exports = {};

exports.create = async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).send({ 
        message: "Position title is required!" 
      });
    }

    if (req.body.departmentID) {
      const department = await Department.findByPk(req.body.departmentID);
      if (!department) {
        return res.status(404).send({ 
          message: "Department not found!" 
        });
      }
    }

    const existingPosition = await Position.findOne({
      where: {
        title: req.body.title,
        departmentID: req.body.departmentID || null
      }
    });

    if (existingPosition) {
      return res.status(409).send({ 
        message: `Position with title "${req.body.title}" already exists in this department!` 
      });
    }

    const position = {
      title: req.body.title,
      description: req.body.description || null,
      departmentID: req.body.departmentID || null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const data = await Position.create(position);
    
    res.status(201).send({
      message: "Position created successfully!",
      data: data
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Position."
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { departmentID, isActive, page = 1, limit = 10 } = req.query;
    
    const where = {};
    
    if (departmentID) {
      where.departmentID = departmentID;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Position.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          attributes: ["ID", "name"],
          required: false
        },
        {
          model: User,
          attributes: ["ID", "name", "email"],
          required: false,
          through: { attributes: [] } 
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['title', 'ASC']]
    });

    res.send({
      totalItems: count,
      positions: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving positions."
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const positionID = req.params.id;

    const data = await Position.findByPk(positionID, {
      include: [
        {
          model: Department,
          attributes: ["ID", "name"],
          required: false
        },
        {
          model: User,
          attributes: ["ID", "name", "email"],
          required: false,
          through: { attributes: [] }
        }
      ]
    });

    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `Position with positionID=${positionID} not found.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Position with positionID=${req.params.id}`
    });
  }
};

exports.update = async (req, res) => {
  try {
    const positionID = req.params.id;

    const position = await Position.findByPk(positionID);
    if (!position) {
      return res.status(404).send({
        message: `Position with positionID=${positionID} not found.`
      });
    }

    if (req.body.departmentID) {
      const department = await Department.findByPk(req.body.departmentID);
      if (!department) {
        return res.status(404).send({ 
          message: "Department not found!" 
        });
      }
    }

    if (req.body.title && req.body.title !== position.title) {
      const existingPosition = await Position.findOne({
        where: {
          title: req.body.title,
          departmentID: req.body.departmentID ?? position.departmentID ?? null,
          positionID: { [db.Sequelize.Op.ne]: positionID }
        }
      });

      if (existingPosition) {
        return res.status(409).send({ 
          message: `Position with title "${req.body.title}" already exists in this department!` 
        });
      }
    }

    delete req.body.positionID;

    const [num] = await Position.update(req.body, { 
      where: { positionID: positionID } 
    });

    if (num === 1) {
      const updatedPosition = await Position.findByPk(positionID);
      res.send({
        message: "Position updated successfully.",
        data: updatedPosition
      });
    } else {
      res.send({
        message: `Cannot update Position with positionID=${positionID}. No changes were made.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error updating Position with positionID=${req.params.id}`
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const positionID = req.params.id;

    const position = await Position.findByPk(positionID);
    if (!position) {
      return res.status(404).send({
        message: `Position with positionID=${positionID} not found.`
      });
    }

    const userCount = await position.countUsers();
    if (userCount > 0) {
      await Position.update(
        { isActive: false },
        { where: { positionID: positionID } }
      );
      
      return res.send({
        message: `Position deactivated successfully. ${userCount} user(s) are still assigned to this position.`
      });
    }

    await Position.destroy({ where: { positionID: positionID } });
    
    res.send({
      message: "Position deleted successfully!"
    });
  } catch (err) {
    res.status(500).send({
      message: `Could not delete Position with positionID=${req.params.id}`
    });
  }
};

exports.restore = async (req, res) => {
  try {
    const positionID = req.params.id;

    const position = await Position.findByPk(positionID);
    if (!position) {
      return res.status(404).send({
        message: `Position with positionID=${positionID} not found.`
      });
    }

    if (position.isActive) {
      return res.status(400).send({
        message: "Position is already active."
      });
    }

    await Position.update(
      { isActive: true },
      { where: { positionID: positionID } }
    );

    res.send({
      message: "Position restored successfully!"
    });
  } catch (err) {
    res.status(500).send({
      message: `Error restoring Position with positionID=${req.params.id}`
    });
  }
};

exports.getPositionUsers = async (req, res) => {
  try {
    const positionID = req.params.id;

    const position = await Position.findByPk(positionID, {
      include: [
        {
          model: User,
          attributes: ["ID", "name", "email"],
          through: { attributes: [] }
        }
      ]
    });

    if (!position) {
      return res.status(404).send({
        message: `Position with positionID=${positionID} not found.`
      });
    }

    res.send({
      position: {
        positionID: position.positionID,
        title: position.title
      },
      users: position.users || []
    });
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving users for Position with positionID=${req.params.id}`
    });
  }
};

export default exports;
