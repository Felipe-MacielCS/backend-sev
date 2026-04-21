import "dotenv/config";
import db from "../app/models/index.js";

const DEFAULT_DEPARTMENT_ID = Number(process.argv[2] || 1);
const DEFAULT_POSITION_RATE = Number(process.argv[3] || 15);

const Department = db.department;
const DepartmentUser = db.departmentusers;
const Position = db.position;
const User = db.user;
const UserPosition = db.userposition;

const ensureColumn = async (tableName, columnName, definition) => {
  const queryInterface = db.sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable(tableName);
  if (!columns[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

const run = async () => {
  try {
    const departmentID =
      Number.isFinite(DEFAULT_DEPARTMENT_ID) && DEFAULT_DEPARTMENT_ID > 0
        ? DEFAULT_DEPARTMENT_ID
        : 1;
    const defaultRate =
      Number.isFinite(DEFAULT_POSITION_RATE) && DEFAULT_POSITION_RATE >= 0
        ? Number(DEFAULT_POSITION_RATE.toFixed(2))
        : 15;

    await ensureColumn("department_users", "employee_pay_rate", {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await ensureColumn("positions", "pay_rate", {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    const department = await Department.findByPk(departmentID);
    if (!department) {
      throw new Error(`Department ${departmentID} was not found.`);
    }

    const positions = await Position.findAll({
      where: { departmentID },
      order: [["positionID", "ASC"]],
    });

    if (!positions.length) {
      throw new Error(`No positions were found for department ${departmentID}.`);
    }

    for (const position of positions) {
      if (position.pay_rate == null) {
        await position.update({ pay_rate: defaultRate });
        console.log(`Set pay_rate for position ${position.title} (#${position.positionID}) to ${defaultRate.toFixed(2)}`);
      }
    }

    const fallbackPosition = positions[0];

    const departmentUsers = await DepartmentUser.findAll({
      where: { departmentID, role: "worker" },
      order: [["ID", "ASC"]],
    });

    for (const departmentUser of departmentUsers) {
      const workerUserID = Number(departmentUser.userID);
      if (!workerUserID) continue;

      const user = await User.findByPk(workerUserID, {
        attributes: ["ID", "name", "role"],
      });
      if (user && String(user.role || "").toLowerCase() !== "worker") continue;

      const assignments = await UserPosition.findAll({
        where: { userID: workerUserID },
        order: [["ID", "ASC"]],
      });

      let targetPosition = null;
      if (assignments.length) {
        const assignedPositionIDs = assignments.map((row) => Number(row.positionID)).filter(Boolean);
        targetPosition =
          positions.find((position) => assignedPositionIDs.includes(Number(position.positionID))) || null;
      }

      if (!targetPosition) {
        await UserPosition.findOrCreate({
          where: {
            userID: workerUserID,
            positionID: fallbackPosition.positionID,
          },
          defaults: {
            userID: workerUserID,
            positionID: fallbackPosition.positionID,
          },
        });
        targetPosition = fallbackPosition;
        console.log(`Assigned user ${workerUserID} to fallback position ${fallbackPosition.title} (#${fallbackPosition.positionID})`);
      }

      const nextRate =
        targetPosition.pay_rate != null
          ? Number(targetPosition.pay_rate)
          : defaultRate;

      await departmentUser.update({
        employee_pay_rate: Number(nextRate.toFixed(2)),
      });

      console.log(`Set employee_pay_rate for user ${workerUserID} to ${Number(nextRate).toFixed(2)}`);
    }
  } catch (error) {
    console.error("Failed to sync worker pay rates:", error.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
};

run();
