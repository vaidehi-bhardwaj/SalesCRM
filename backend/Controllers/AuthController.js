const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/User");
const nodemailer = require('nodemailer');
const transporter = require("../Models/emailService");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    const errorMsg = "Auth failed email or password is wrong";
     if (!email || !password) {
       return res
         .status(400)
         .json({ message: "Email and password are required.", success: false });
     }
    if (!user) {
      return res
        .status(403)
        .json({
          message: errorMsg,
          success: false,
        });
    }
    const isPassEqual = await bcrypt.compare(password,user.password);
    if(!isPassEqual){
        return res.status(403).json({
          message: errorMsg,
          success: false,
        });
    }
  const jwtToken = jwt.sign(
    { email: user.email, _id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  res.status(200).json({
    message: "login sucessful",
    success: true,
    jwtToken,
    email,
    name: user.name,
    userId: user._id, // Add this line to include the userId in the response
  });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Link",
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        console.log("Email User:", process.env.EMAIL_USER);
        console.log("Email Pass:", process.env.EMAIL_PASS);

        return res
          .status(500)
          .json({ success: false, message: "Error sending email" });
      }
      console.log("Email sent:", info.response);
      res.json({ success: true, message: "Password reset link sent to email" });
    });
  } catch (error) {
    console.error("Server error:", error);
    console.log("Email User:", process.env.EMAIL_USER);
    console.log("Email Pass:", process.env.EMAIL_PASS);

    res.status(500).json({ success: false, message: "Server error" });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, forgotPassword, resetPassword };

