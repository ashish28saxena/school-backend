const express = require("express");
const router = express.Router();
const Permission = require("../models/Permission");

// Get all modules
router.get("/list", async (req, res) => {
  try {
    const data = await Permission.find({ status: true }).sort({
      displayName: 1,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add a module (normally seed script is used)
router.post("/add", async (req, res) => {
  try {
    const { moduleName, displayName } = req.body;

    if (!moduleName || !displayName) {
      return res.status(400).json({
        success: false,
        message: "moduleName and displayName are required",
      });
    }

    const data = await Permission.create({
      moduleName: moduleName.toLowerCase().trim(),
      displayName: displayName.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Module added successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;