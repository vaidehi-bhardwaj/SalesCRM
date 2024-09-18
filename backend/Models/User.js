const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    // User type
    type: String,
    enum: ["subuser", "supervisor", "admin"],
    default: "subuser",
  },
  supervisor: {
    // User assigned to
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

const UserModel = mongoose.model("user", UserSchema);
module.exports = UserModel;
