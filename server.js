import routes from "./app/routes/index.js";
import express, { json, urlencoded } from "express"
import cors from "cors";

import db  from "./app/models/index.js";

db.sequelize.sync({});

const app = express();

var corsOptions = {
  origin: "http://localhost:8081",
  credentials: true
}
app.use(cors(corsOptions));


app.use(express.json());

app.use(express.urlencoded({ extended: true }));
  

app.use("/workerscheduling-t7", routes); 

const PORT = process.env.PORT || 3100;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

export default app;
