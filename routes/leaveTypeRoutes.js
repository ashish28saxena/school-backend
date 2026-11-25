
const express = require("express");
const router = express.Router();

const LeaveType = require("../models/LeaveType");
const authMiddleware = require("../middleware/authMiddleware");

// Add Leave Type
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { leaveTypeName, description, totalDays, status } = req.body;

    if (!leaveTypeName) {
      return res.status(400).json({
        success: false,
        message: "Leave type name is required",
      });
    }

    const exists = await LeaveType.findOne({
      leaveTypeName: leaveTypeName.trim(),
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Leave type already exists",
      });
    }

    const leaveType = await LeaveType.create({
      leaveTypeName,
      description,
      totalDays,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Leave type added successfully",
      data: leaveType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get All Leave Types
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaveTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Active Leave Types
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({ status: true });

    res.json({
      success: true,
      data: leaveTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update Leave Type
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    res.json({
      success: true,
      message: "Leave type updated successfully",
      data: leaveType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete Leave Type
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const leaveType = await LeaveType.findByIdAndDelete(req.params.id);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    res.json({
      success: true,
      message: "Leave type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
