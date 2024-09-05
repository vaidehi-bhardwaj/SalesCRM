const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const User = require("./Models/User"); // Adjust the path if needed
const { v4: uuidv4 } = require("uuid"); // Add this line to import uuid
require("dotenv").config();

const mongo_url = process.env.MONGO_CONN;
mongoose
  .connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log("MongoDB Connection Error: ", err));

const users = JSON.parse(fs.readFileSync("Users.json", "utf-8"));

async function hashAndSaveUsers() {
  for (let user of users) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    // Generate a unique userId
    user.userId = uuidv4();

    const newUser = new User(user);
    await newUser.save();
  }
  console.log("Users created successfully");
  mongoose.connection.close();
}

hashAndSaveUsers().catch((err) => console.error(err));
