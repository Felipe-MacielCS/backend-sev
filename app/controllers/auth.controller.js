// app/controllers/auth.controller.js
import db from "../models/index.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const User = db.user;
const Athlete = db.athlete;
const Coach = db.coach;            
const Session = db.session;
const google_id = process.env.CLIENT_ID;

const exportsObj = {};

exportsObj.login = async (req, res) => {
  try {
    const googleToken = req.body.credential;

    const isAthlete = req.body.isAthlete || false;
    const isCoach = req.body.isCoach || false; 
    const sport = req.body.sport || null;
    const age = req.body.age || null;
    const weight = req.body.weight || null;
    const height = req.body.height || null;

    const client = new OAuth2Client(google_id);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    const googleUser = ticket.getPayload();

    const email = googleUser.email;
    const name = `${googleUser.given_name} ${googleUser.family_name}`;

    let user = await User.findOne({ where: { email } });

    if (!user) {

      user = await User.create({
        name,
        email,
        isAdmin: false,
      });
      console.log("New user created:", user.dataValues);

      if (isAthlete) {
        const athlete = await Athlete.create({
          userID: user.userID,
          sport,
          age,
          weight,
          height,
        });
        console.log(" Athlete profile created:", athlete.dataValues);
      } else if (isCoach) {
        const coach = await Coach.create({
          userID: user.userID,
        });
        console.log(" Coach profile created:", coach.dataValues);
      }
    } else {

      user.name = name; 
      await user.save();
      console.log(" Existing user updated:", user.dataValues);


      if (isCoach) {
        const existingCoach = await Coach.findOne({
          where: { userID: user.userID },
        });
        if (!existingCoach) {
          const coach = await Coach.create({ userID: user.userID });
          console.log(" Coach profile created for existing user:", coach.dataValues);
        }
      }


    }

    await Session.destroy({ where: { email } });

    const token = crypto.randomBytes(64).toString("hex");
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    const session = await Session.create({
      email,
      token,
      expirationDate,
    });

    console.log(" New session created:", session.dataValues);

    res.send({
      userID: user.userID,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      token: session.token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ message: err.message });
  }
};

// ---------------------- AUTHORIZE ----------------------
exportsObj.authorize = async (req, res) => {
  try {
    console.log(" Authorize endpoint hit for user:", req.params.id);
    res.send({
      message: "Authorize endpoint active (placeholder).",
      userId: req.params.id,
    });
  } catch (err) {
    console.error(" Authorize error:", err);
    res.status(500).send({ message: err.message });
  }
};

exportsObj.logout = async (req, res) => {
  try {
    const authHeader = req.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).send({ message: "No token provided" });
    }

    const token = authHeader.slice(7);
    const deleted = await Session.destroy({ where: { token } });

    if (deleted) {
      console.log("Session deleted successfully.");
      res.send({ message: "User logged out successfully." });
    } else {
      res.status(404).send({ message: "Session not found." });
    }
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).send({ message: "Error logging out user." });
  }
};

export default exportsObj;
