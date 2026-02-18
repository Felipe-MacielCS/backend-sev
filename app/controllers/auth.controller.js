import db from "../models/index.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const User = db.user;
const Session = db.session;
const google_id = process.env.CLIENT_ID;

const exportsObj = {};

exportsObj.login = async (req, res) => {
  try {
    const googleToken = req.body.credential;

    const client = new OAuth2Client(google_id);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    const googleUser = ticket.getPayload();

    const email = googleUser.email;
    const name = `${googleUser.given_name} ${googleUser.family_name}`;

    // Search for existing user by email
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user with the default 'Worker' role
      user = await User.create({
        name,
        email,
        role: "Worker", // Consolidating Athlete/Coach into a single role attribute
        status: "active",
      });
      console.log("New user created with default Worker role:", user.dataValues);
    } else {
      // Update name if changed on Google side
      user.name = name; 
      await user.save();
      console.log("Existing user logged in:", user.dataValues);
    }

    // Standardize session management: Clean up old sessions and create a new token
    await Session.destroy({ where: { email } });

    const token = crypto.randomBytes(64).toString("hex");
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration

    const session = await Session.create({
      email,
      token,
      expirationDate,
    });

    console.log("New session created for:", email);

    // Return the user data and the new role attribute to the frontend
    res.send({
      userID: user.ID, 
      email: user.email,
      name: user.name,
      role: user.role,    // The frontend now uses this to determine permissions
      token: session.token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ message: err.message });
  }
};

// Authorize endpoint (Placeholder for custom logic)
exportsObj.authorize = async (req, res) => {
  try {
    res.send({
      message: "Authorize endpoint active.",
      userId: req.params.id,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Logout: Destroy the specific session token
exportsObj.logout = async (req, res) => {
  try {
    const authHeader = req.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).send({ message: "No token provided" });
    }

    const token = authHeader.slice(7);
    const deleted = await Session.destroy({ where: { token } });

    if (deleted) {
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