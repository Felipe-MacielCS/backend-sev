import db from "../models/index.js";
const Unavailability = db.unavailability;
const User = db.user;
const Op = db.Sequelize.Op;

const exports = {};

exports.create = async (req, res) => {
  try {
    if (!req.body.userID) {
      return res.status(400).send({ 
        message: "User ID is required!" 
      });
    }

    if (!req.body.start_date) {
      return res.status(400).send({ 
        message: "Start date is required!" 
      });
    }

    if (!req.body.end_date) {
      return res.status(400).send({ 
        message: "End date is required!" 
      });
    }

    const user = await User.findByPk(req.body.userID);
    if (!user) {
      return res.status(404).send({ 
        message: "User not found!" 
      });
    }

    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);

    if (isNaN(startDate.getTime())) {
      return res.status(400).send({ 
        message: "Invalid start date format!" 
      });
    }

    if (isNaN(endDate.getTime())) {
      return res.status(400).send({ 
        message: "Invalid end date format!" 
      });
    }

    if (endDate < startDate) {
      return res.status(400).send({ 
        message: "End date must be after or equal to start date!" 
      });
    }

    const overlapping = await Unavailability.findOne({
      where: {
        userID: req.body.userID,
        [Op.or]: [
          {
            start_date: { [Op.lte]: req.body.start_date },
            end_date: { [Op.gte]: req.body.start_date }
          },
          {
            start_date: { [Op.lte]: req.body.end_date },
            end_date: { [Op.gte]: req.body.end_date }
          },
          {
            start_date: { [Op.gte]: req.body.start_date },
            end_date: { [Op.lte]: req.body.end_date }
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(409).send({ 
        message: "User already has an overlapping unavailability period!" 
      });
    }

    const unavailability = {
      userID: req.body.userID,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      start_time: req.body.start_time || null,
      end_time: req.body.end_time || null,
      reason: req.body.reason || null,
      isRecurring: req.body.isRecurring || false
    };

    const data = await Unavailability.create(unavailability);
    
    res.status(201).send({
      message: "Unavailability created successfully!",
      data: data
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Unavailability."
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { userID, start_date, end_date, isRecurring, page = 1, limit = 20 } = req.query;
    
    const where = {};
    
    if (userID) {
      where.userID = userID;
    }
    
    if (isRecurring !== undefined) {
      where.isRecurring = isRecurring === 'true';
    }

    if (start_date || end_date) {
      where[Op.and] = [];
      
      if (start_date) {
        where[Op.and].push({
          end_date: { [Op.gte]: start_date }
        });
      }
      
      if (end_date) {
        where[Op.and].push({
          start_date: { [Op.lte]: end_date }
        });
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Unavailability.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ["userID", "name", "email"],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['start_date', 'DESC'], ['start_time', 'ASC']]
    });

    res.send({
      totalItems: count,
      unavailabilities: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error("Error retrieving unavailabilities:", err);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving unavailabilities."
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const unavailabilityID = req.params.id;

    const data = await Unavailability.findByPk(unavailabilityID, {
      include: [
        {
          model: User,
          attributes: ["userID", "name", "email"],
        }
      ]
    });

    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `Unavailability with unavailabilityID=${unavailabilityID} not found.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Unavailability with unavailabilityID=${req.params.id}`
    });
  }
};

exports.findByUser = async (req, res) => {
  try {
    const userID = req.params.userID;
    const { upcoming, page = 1, limit = 20 } = req.query;

    const user = await User.findByPk(userID);
    if (!user) {
      return res.status(404).send({ 
        message: "User not found!" 
      });
    }

    const where = { userID };

    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      where.end_date = { [Op.gte]: today };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Unavailability.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['start_date', 'ASC'], ['start_time', 'ASC']]
    });

    res.send({
      totalItems: count,
      unavailabilities: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving user unavailability."
    });
  }
};

exports.update = async (req, res) => {
  try {
    const unavailabilityID = req.params.id;

    const unavailability = await Unavailability.findByPk(unavailabilityID);
    if (!unavailability) {
      return res.status(404).send({
        message: `Unavailability with unavailabilityID=${unavailabilityID} not found.`
      });
    }

    const newStartDate = req.body.start_date || unavailability.start_date;
    const newEndDate = req.body.end_date || unavailability.end_date;

    if (new Date(newEndDate) < new Date(newStartDate)) {
      return res.status(400).send({ 
        message: "End date must be after or equal to start date!" 
      });
    }

    if (req.body.start_date || req.body.end_date) {
      const overlapping = await Unavailability.findOne({
        where: {
          unavailabilityID: { [Op.ne]: unavailabilityID },
          userID: unavailability.userID,
          [Op.or]: [
            {
              start_date: { [Op.lte]: newStartDate },
              end_date: { [Op.gte]: newStartDate }
            },
            {
              start_date: { [Op.lte]: newEndDate },
              end_date: { [Op.gte]: newEndDate }
            },
            {
              start_date: { [Op.gte]: newStartDate },
              end_date: { [Op.lte]: newEndDate }
            }
          ]
        }
      });

      if (overlapping) {
        return res.status(409).send({ 
          message: "Updated dates would overlap with another unavailability period!" 
        });
      }
    }

    delete req.body.userID;
    delete req.body.unavailabilityID;

    const [num] = await Unavailability.update(req.body, { 
      where: { unavailabilityID: unavailabilityID } 
    });

    if (num === 1) {
      const updatedData = await Unavailability.findByPk(unavailabilityID);
      res.send({
        message: "Unavailability updated successfully.",
        data: updatedData
      });
    } else {
      res.send({
        message: `Cannot update Unavailability with unavailabilityID=${unavailabilityID}. No changes were made.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Error updating Unavailability with unavailabilityID=${req.params.id}`
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const unavailabilityID = req.params.id;

    const num = await Unavailability.destroy({ 
      where: { unavailabilityID: unavailabilityID } 
    });

    if (num === 1) {
      res.send({
        message: "Unavailability deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete Unavailability with unavailabilityID=${unavailabilityID}. Maybe it was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Could not delete Unavailability with unavailabilityID=${req.params.id}`
    });
  }
};

exports.deletePast = async (req, res) => {
  try {
    const userID = req.params.userID;
    const today = new Date().toISOString().split('T')[0];

    const num = await Unavailability.destroy({
      where: {
        userID: userID,
        end_date: { [Op.lt]: today }
      }
    });

    res.send({
      message: `${num} past unavailability entries deleted successfully!`
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error deleting past unavailability entries."
    });
  }
};

export default exports;