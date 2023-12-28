require("dotenv").config();
const connectDB = require("./db/connect");

const users = require("./models/users");

const userJson = require("./userentry.json");

const start = async () => {
  try {
    await connectDB(process.env.MongoDB_URL);
    await users.create(userJson);
    console.log(`Success`);
    process.exit(0);
  } catch (error) {
    console.log(error);
  }
};

start();
