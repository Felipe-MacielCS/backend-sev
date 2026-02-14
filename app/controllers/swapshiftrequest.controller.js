import db from "../models/index.js";
const SwapShiftRequest = db.swapShiftRequest;
const Op = db.Sequelize.Op;

const exports = {};

// Create a new Swap Shift Request
exports.create = (req, res) => {
  if (!req.body.userShiftID) {
    res.status(400).send({ message: "User Shift ID cannot be empty!" });
    return;
  }

  const request = {
    status: req.body.status || "Pending",
    userShiftID: req.body.userShiftID,
  };

  SwapShiftRequest.create(request)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Error occurred while creating the request.",
      })
    );
};

// Retrieve all requests (can filter by status)
exports.findAll = (req, res) => {
  const status = req.query.status;
  let condition = status ? { status: { [Op.like]: `%${status}%` } } : null;

  SwapShiftRequest.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving requests.",
      })
    );
};

// Find a single request by swapShiftRequestID
exports.findOne = (req, res) => {
  const id = req.params.id;

  SwapShiftRequest.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else res.status(404).send({ message: `Request with id=${id} not found.` });
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving request with id=" + id })
    );
};

// Update a request (e.g., a manager approving/denying it)
exports.update = (req, res) => {
  const id = req.params.id;

  SwapShiftRequest.update(req.body, { where: { swapShiftRequestID: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Request updated successfully." });
      } else {
        res.send({ message: `Cannot update request with id=${id}.` });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: "Error updating request with id=" + id })
    );
};

// Delete a request
exports.delete = (req, res) => {
  const id = req.params.id;

  SwapShiftRequest.destroy({ where: { swapShiftRequestID: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Request deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete request with id=${id}.` });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: "Could not delete request with id=" + id })
    );
};

export default exports;