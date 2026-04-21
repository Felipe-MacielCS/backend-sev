import "dotenv/config";
import db from "../app/models/index.js";

const User = db.user;
const Department = db.department;
const DepartmentUser = db.departmentusers;

const DEFAULT_DEPARTMENT_ID = Number(process.argv[2] || 1);

const workers = [
  {
    name: "Avery Carter",
    email: "avery.carter.worker@example.com",
    phone: "555-0101",
  },
  {
    name: "Jordan Lee",
    email: "jordan.lee.worker@example.com",
    phone: "555-0102",
  },
  {
    name: "Taylor Brooks",
    email: "taylor.brooks.worker@example.com",
    phone: "555-0103",
  },
];

const run = async () => {
  try {
    const departmentID = Number.isFinite(DEFAULT_DEPARTMENT_ID) && DEFAULT_DEPARTMENT_ID > 0
      ? DEFAULT_DEPARTMENT_ID
      : 1;

    const department = await Department.findByPk(departmentID);
    if (!department) {
      throw new Error(`Department ${departmentID} was not found.`);
    }

    for (const worker of workers) {
      const [user, created] = await User.findOrCreate({
        where: { email: worker.email },
        defaults: {
          name: worker.name,
          email: worker.email,
          phone: worker.phone,
          role: "Worker",
          status: "active",
        },
      });

      if (!created) {
        await user.update({
          name: worker.name,
          phone: worker.phone,
          role: "Worker",
          status: "active",
        });
      }

      await DepartmentUser.findOrCreate({
        where: {
          userID: user.ID,
          departmentID,
        },
        defaults: {
          userID: user.ID,
          departmentID,
          role: "worker",
        },
      });

      console.log(`${created ? "Created" : "Updated"} worker ${worker.email} in department ${departmentID}`);
    }
  } catch (error) {
    console.error("Failed to seed workers:", error.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
};

run();
