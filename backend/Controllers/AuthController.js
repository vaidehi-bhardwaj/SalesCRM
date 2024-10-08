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
     if (!user || user.status === "inactive") {
       return res.status(403).json({
         success: false,
         message: user
           ? "Your account is inactive."
           : "Invalid email or password",
       });
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
    firstName: user.firstName,
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

   const token = jwt.sign(
     {
       _id: user._id,
       firstName: user.firstName,
       role: user.role,
     },
     process.env.JWT_SECRET,
     { expiresIn: "24h" }
   );
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
     
        return res
          .status(500)
          .json({ success: false, message: "Error sending email" });
      }

      res.json({ success: true, message: "Password reset link sent to email" });
    });
  } catch (error) {
    console.error("Server error:", error);
 
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ success: false, message: "Token has expired" });
      }
      console.error("Token verification error:", error); // Log the error for better insight
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const user = await UserModel.findById(decoded._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;


    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

 

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



module.exports = { login, forgotPassword, resetPassword, changePassword };

