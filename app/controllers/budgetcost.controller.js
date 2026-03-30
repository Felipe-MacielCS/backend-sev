import db from "../models/index.js";

const BudgetCost = db.budgetcost;

export const createCost = async (req, res) => {
  try {
    const departmentID = Number(req.body.departmentID);
    const name = String(req.body.name || "").trim();
    const amount = Number(req.body.amount);

    if (!Number.isFinite(departmentID) || departmentID <= 0) {
      return res.status(400).json({ message: "Valid departmentID is required." });
    }

    if (!name) {
      return res.status(400).json({ message: "Cost name is required." });
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Valid amount is required." });
    }

    const cost = await BudgetCost.create({
      departmentID,
      name,
      amount,
    });

    return res.status(201).json({ cost });
  } catch (error) {
    console.error("Error creating budget cost:", error);
    return res.status(500).json({ message: "Failed to create cost." });
  }
};

export const updateCost = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const amount = Number(req.body.amount);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: "Valid cost ID is required." });
    }

    if (!name) {
      return res.status(400).json({ message: "Cost name is required." });
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Valid amount is required." });
    }

    const cost = await BudgetCost.findByPk(id);

    if (!cost) {
      return res.status(404).json({ message: "Cost not found." });
    }

    await cost.update({
      name,
      amount,
    });

    return res.status(200).json({ cost });
  } catch (error) {
    console.error("Error updating budget cost:", error);
    return res.status(500).json({ message: "Failed to update cost." });
  }
};

export const deleteCost = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ message: "Valid cost ID is required." });
    }

    const cost = await BudgetCost.findByPk(id);

    if (!cost) {
      return res.status(404).json({ message: "Cost not found." });
    }

    await cost.destroy();

    return res.status(200).json({ message: "Cost deleted successfully." });
  } catch (error) {
    console.error("Error deleting budget cost:", error);
    return res.status(500).json({ message: "Failed to delete cost." });
  }
};