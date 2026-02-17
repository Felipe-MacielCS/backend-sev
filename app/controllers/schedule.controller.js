import db from "../models/index.js";
const Schedule = db.schedule;

const exports = {};

exports.create = async (req, res) => {
  try {
    const { start_date, end_date, status, type, departmentID } = req.body;

    if (!start_date || !end_date || !status || !type || !departmentID) {
      return res.status(400).send({
        message: "start_date, end_date, status, type, and departmentID are required!",
      });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).send({ message: "start_date cannot be after end_date!" });
    }

    const data = await Schedule.create({ start_date, end_date, status, type, departmentID });

    return res.status(201).send({ message: "Schedule created successfully!", data });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Schedule.",
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { departmentID, status, type, page = 1, limit = 10 } = req.query;
    const where = {};
    if (departmentID) where.departmentID = departmentID;
    if (status) where.status = status;
    if (type) where.type = type;

    const offset = (page - 1) * limit;

    const { count, rows } = await Schedule.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["start_date", "DESC"]],
    });

    return res.send({
      totalItems: count,
      schedules: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving schedules.",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Schedule.findByPk(id);

    if (!data) return res.status(404).send({ message: `Schedule with ID=${id} not found.` });
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: `Error retrieving Schedule with ID=${req.params.id}`,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) return res.status(404).send({ message: `Schedule with ID=${id} not found.` });

    if (req.body.start_date && req.body.end_date) {
      if (new Date(req.body.start_date) > new Date(req.body.end_date)) {
        return res.status(400).send({ message: "start_date cannot be after end_date!" });
      }
    }

    delete req.body.ID;

    const [num] = await Schedule.update(req.body, { where: { ID: id } });

    if (num === 1) {
      const updated = await Schedule.findByPk(id);
      return res.send({ message: "Schedule updated successfully.", data: updated });
    }

    return res.send({ message: `Cannot update Schedule with ID=${id}. No changes were made.` });
  } catch (err) {
    return res.status(500).send({
      message: `Error updating Schedule with ID=${req.params.id}`,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const num = await Schedule.destroy({ where: { ID: id } });
    if (num === 1) return res.send({ message: "Schedule deleted successfully!" });

    return res.status(404).send({ message: `Schedule with ID=${id} not found.` });
  } catch (err) {
    return res.status(500).send({
      message: `Could not delete Schedule with ID=${req.params.id}`,
    });
  }
};

export default exports;
