import db from "../models/index.js";
const Session = db.session;
const User = db.user;

const authenticate = (req, res, next) => {
  let token = null;
 
  let authHeader = req.get("authorization");
  if (authHeader != null) {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);

      // Find the session and include the User to check their role
      Session.findOne({ where: { token: token } })
        .then(async (session) => {
          if (session != null) {
            if (session.expirationDate >= Date.now()) {
              
              // Optional: Attach user role to the request for further checks
              const user = await User.findOne({ where: { email: session.email } });
              if (user) {
                req.userRole = user.role; 
                req.userID = user.ID; 
              }

              next();
              return;
            } else {
              return res.status(401).send({
                message: "Unauthorized! Expired Token, Logout and Login again",
              });
            }
          } else {
            return res.status(401).send({
              message: "Unauthorized! Invalid Token",
            });
          }
        })
        .catch((err) => {
          console.log(err.message);
          return res.status(500).send({ message: "Error validating session" });
        });
    }
  } else {
    return res.status(401).send({
      message: "Unauthorized! No Auth Header",
    });
  }
};

export default authenticate;