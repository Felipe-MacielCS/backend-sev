import db from "../models/index.js";
const User = db.user;
const DepartmentUser = db.departmentusers;
const UserPosition = db.userposition;
const UserShift = db.usershift;
const UserShiftTaskList = db.usershifttasklist;
const TaskListItemStatus = db.tasklistitemstatus;
const ClockInOut = db.clockinout;
const SwapShiftRequest = db.swapshiftrequest;
const UserNotification = db.usernotification;
const Unavailable = db.unavailable;
const SettingsValues = db.settingsvalues;
const Announcement = db.announcement;
const Session = db.session;
const Op = db.Sequelize.Op;

const exports = {};

// Create a new user with a specific role
exports.create = (req, res) => {
  const { name, email, phone, status, role } = req.body;

  if (!name || !email) {
    res.status(400).send({ message: "name and email are required." });
    return;
  }

  const user = {
    name,
    email,
    phone: phone ?? null,
    status: status ?? "active",
    role: role ?? "Worker", // Support for the new consolidated role attribute
  };

  User.create(user)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      })
    );
};

// Get all users (optionally filter by status, email, or role)
exports.findAll = (req, res) => {
  const { status, email, role } = req.query;

  const where = {};
  if (status) where.status = status;
  if (email) where.email = email;
  if (role) where.role = role;

  User.findAll({ where })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      })
    );
};

// Get one user by userID
exports.findOne = (req, res) => {
  const userID = req.params.id;

  User.findByPk(userID)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Cannot find User with userID=${userID}.` });
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error retrieving User with userID=" + userID,
      })
    );
};

// Update a user by userID
exports.update = (req, res) => {
  const userID = req.params.id;
  
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({ message: "Request body cannot be empty." });
    return;
  }

  // The user model uses ID as its primary key.
  User.update(req.body, { where: { ID: userID } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;

      if (affected === 1) res.send({ message: "User updated successfully." });
      else {
        res.send({
          message: `Cannot update User with userID=${userID}. Maybe it was not found or nothing changed.`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({
        message: "Error updating User with userID=" + userID,
      })
    );
};

// Delete a user by userID
exports.delete = async (req, res) => {
  const userID = req.params.id;

  try {
    const user = await User.findByPk(userID);
    if (!user) {
      return res.send({
        message: `Cannot delete User with userID=${userID}. Maybe it was not found!`,
      });
    }

    const userShifts = await UserShift.findAll({
      where: { userID },
      attributes: ["ID"],
    });
    const userShiftIDs = userShifts
      .map((row) => Number(row?.ID))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (userShiftIDs.length) {
      await ClockInOut.destroy({ where: { user_shift_id: { [Op.in]: userShiftIDs } } });
      await SwapShiftRequest.destroy({ where: { userShiftID: { [Op.in]: userShiftIDs } } });
      await UserShiftTaskList.destroy({ where: { user_shiftID: { [Op.in]: userShiftIDs } } });
      await TaskListItemStatus.destroy({ where: { user_shiftID: { [Op.in]: userShiftIDs } } });
    }

    await TaskListItemStatus.destroy({ where: { checked_by: userID } });
    await DepartmentUser.destroy({ where: { userID } });
    await UserPosition.destroy({ where: { userID } });
    await UserShift.destroy({ where: { userID } });
    await UserNotification.destroy({ where: { userID } });
    await Unavailable.destroy({ where: { userID } });
    await SettingsValues.destroy({ where: { userID } });
    await Announcement.destroy({ where: { createdByUserID: userID } });
    await Session.destroy({ where: { email: user.email } });

    const num = await User.destroy({ where: { ID: userID } });
    if (num === 1) {
      return res.send({ message: "User deleted successfully!" });
    }

    return res.send({
      message: `Cannot delete User with userID=${userID}. Maybe it was not found!`,
    });
  } catch (err) {
    console.error("User delete failed:", err);
    return res.status(500).send({
      message: "Could not delete User with userID=" + userID,
    });
  }
};

export default exports;
