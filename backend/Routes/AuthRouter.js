const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/User"); // Adjust the path as needed
const { loginValidation } = require("../Middleware/AuthValidation");
const {
  forgotPassword,
  resetPassword,
} = require("../Controllers/AuthController");


router.post("/login", loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for email:", email);

    // Find the user by email
    const user = await User.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      console.log("No user found for email:", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch for email:", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    console.log("User role:", user.role);

    // Create JWT token
   const token = jwt.sign(
     {
       _id: user._id,
       name: user.name,
       role: user.role,
       email: user.email, // Optional, include if needed
     },
     process.env.JWT_SECRET,
     { expiresIn: "24h" }
   );

    // Send response with user details including role
    const response = {
      success: true,
      message: "Login successful",
      jwtToken: token,
      name: user.name,
      userId: user._id,
      role: user.role,
    };
    console.log("Sending response:", response);

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Move this route to a separate router file
router.get("/options", async (req, res) => {
  try {
    const options = await OptionsModel.findOne({});
    if (!options) {
      return res.status(404).json({ error: "Options not found" });
    }
    res.json(options);
  } catch (error) {
    console.error("Error fetching options:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
