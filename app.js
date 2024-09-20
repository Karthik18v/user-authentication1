const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "user.db");
const cors = require("cors");
let db = null;
app.use(express.json());
app.use(cors());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log(`Server Running At: http://localhost:3000`)
    );
  } catch (error) {
    process.exit(1);
    console.log(`DB ERROR at ${error.message}`);
  }
};

app.post("/register", async (req, res) => {
  const { userName, email, password } = req.body;

  const selectedUser = `SELECT * FROM USERS WHERE user_name = '${userName}'`;
  const dbUser = await db.get(selectedUser);
  if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    const createUserQuery = `
      INSERT INTO USERS(user_name, email, password )
      VALUES(
          '${userName}',
          '${email}',
          '${hashedPassword}'
      );`;
    await db.run(createUserQuery);
    res.status(200);
    res.send("Successfully Registered");
  } else {
    res.status(400);
    res.send({ message: "User Already Exists" });
  }
});

app.post("/login", async (req, res) => {
  const { userName, password } = req.body;
  console.log(password);
  const selectedUser = `SELECT * FROM USERS WHERE user_name = '${userName}'`;
  const dbUser = await db.get(selectedUser);
  console.log(dbUser);
  if (dbUser === undefined) {
    res.status(400);
    res.send("Invalid user name");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatched);
    if (isPasswordMatched === true) {
      const payload = {
        username: userName,
      };
      const jwtToken = await jwt.sign(payload, "SECRETE");
      res.send({ jwtToken: jwtToken });
      res.status(200);
    } else {
      res.status(400);
      res.send("Invalid Password");
    }
  }
});

initializeDbAndServer();
