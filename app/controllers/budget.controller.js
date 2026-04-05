import db from "../models/index.js";

const Budget = db.budget;
const BudgetCost = db.budgetcost;

export const getDepartmentBudget = async (req, res) => {
  try {
    const departmentID = Number(req.params.departmentID);

    if (!Number.isFinite(departmentID) || departmentID <= 0) {
      return res.status(400).json({ message: "Valid departmentID is required." });
    }

    let budget = await Budget.findOne({
      where: { departmentID },
    });

    if (!budget) {
      budget = await Budget.create({
        departmentID,
        total_budget: 30000,
      });
    }

    const costs = await BudgetCost.findAll({
      where: { departmentID },
      order: [["created_at", "DESC"], ["ID", "DESC"]],
    });

    return res.status(200).json({
      budget,
      costs,
    });
  } catch (error) {
    console.error("Error fetching department budget:", error);
    return res.status(500).json({ message: "Failed to fetch budget." });
  }
};

export const saveDepartmentBudget = async (req, res) => {
  try {
    const departmentID = Number(req.params.departmentID);
    const total_budget = Number(req.body.total_budget);

    if (!Number.isFinite(departmentID) || departmentID <= 0) {
      return res.status(400).json({ message: "Valid departmentID is required." });
    }

    if (!Number.isFinite(total_budget) || total_budget < 0) {
      return res.status(400).json({ message: "Valid total_budget is required." });
    }

    let budget = await Budget.findOne({
      where: { departmentID },
    });

    if (budget) {
      await budget.update({ total_budget });
    } else {
      budget = await Budget.create({
        departmentID,
        total_budget,
      });
    }

    return res.status(200).json({ budget });
  } catch (error) {
    console.error("Error saving department budget:", error);
    return res.status(500).json({ message: "Failed to save budget." });
  }
};