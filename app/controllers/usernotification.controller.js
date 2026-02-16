import db from "../models/index.js";
const UserNotification = db.usernotification;
const Notification = db.notification;

const exports = {};

// User inbox (includes Notification details)
exports.findByUser = async (req, res) => {
  try {
    const userID = req.params.userID;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await UserNotification.findAndCountAll({
      where: { userID },
      include: [{ model: Notification, required: true }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ["date", "DESC"],
        ["time", "DESC"],
      ],
    });

    return res.send({
      totalItems: count,
      userNotifications: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving user notifications.",
    });
  }
};

// Delete one UserNotification row
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const num = await UserNotification.destroy({ where: { ID: id } });
    if (num === 1) return res.send({ message: "UserNotification deleted successfully!" });

    return res.status(404).send({ message: `UserNotification with ID=${id} not found.` });
  } catch (err) {
    return res.status(500).send({
      message: `Could not delete UserNotification with ID=${req.params.id}`,
    });
  }
};

export default exports;
