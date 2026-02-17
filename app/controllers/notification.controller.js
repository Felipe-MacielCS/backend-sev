import db from "../models/index.js";
const Notification = db.notification;
const UserNotification = db.usernotification;

const exports = {};

const nowDateTime = () => {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 8),
  };
};

// Create Notification (optional delivery)
exports.create = async (req, res) => {
  try {
    const { type, message, departmentID, event, userIDs } = req.body;

    if (!type || !message || !departmentID || !event) {
      return res.status(400).send({
        message: "type, message, departmentID, and event are required!",
      });
    }

    const data = await Notification.create({ type, message, departmentID, event });

    if (Array.isArray(userIDs) && userIDs.length > 0) {
      const { date, time } = nowDateTime();
      const deliveries = userIDs.map((userID) => ({
        notificationID: data.ID,
        userID,
        date,
        time,
      }));
      await UserNotification.bulkCreate(deliveries);
    }

    return res.status(201).send({ message: "Notification created successfully!", data });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Notification.",
    });
  }
};

// List Notifications (optional departmentID)
exports.findAll = async (req, res) => {
  try {
    const { departmentID, page = 1, limit = 10 } = req.query;
    const where = {};
    if (departmentID) where.departmentID = departmentID;

    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    return res.send({
      totalItems: count,
      notifications: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving notifications.",
    });
  }
};

// Get one Notification
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Notification.findByPk(id);

    if (!data) return res.status(404).send({ message: `Notification with ID=${id} not found.` });
    return res.send(data);
  } catch (err) {
    return res.status(500).send({
      message: `Error retrieving Notification with ID=${req.params.id}`,
    });
  }
};

// Deliver existing Notification to userIDs
exports.deliver = async (req, res) => {
  try {
    const notificationID = req.params.notificationID;
    const { userIDs } = req.body;

    if (!Array.isArray(userIDs) || userIDs.length === 0) {
      return res.status(400).send({ message: "userIDs (array) is required!" });
    }

    const notification = await Notification.findByPk(notificationID);
    if (!notification) {
      return res.status(404).send({ message: `Notification with ID=${notificationID} not found.` });
    }

    const { date, time } = nowDateTime();
    const deliveries = userIDs.map((userID) => ({
      notificationID: notification.ID,
      userID,
      date,
      time,
    }));

    await UserNotification.bulkCreate(deliveries);

    return res.send({ message: "Notification delivered successfully!", count: deliveries.length });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Error delivering notification.",
    });
  }
};

export default exports;
