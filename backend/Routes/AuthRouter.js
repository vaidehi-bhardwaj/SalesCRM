const express = require("express");
const router = express.Router();
const {
  login,
  forgotPassword,
  resetPassword,
} = require("../Controllers/AuthController");
const { loginValidation } = require("../Middleware/AuthValidation");
const OptionsModel = require("../Models/optionModel");

router.post("/login", loginValidation, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login", async (req, res) => {
  // ... (existing login logic)
  if (user && validPassword) {
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        // ... other user data
      },
    });
  }
  // ... (error handling)
});

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
