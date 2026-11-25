
const express = require("express");
const router = express.Router();

const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");
const authMiddleware = require("../middleware/authMiddleware");

// Assign Leave Balance (Admin)
router.post("/assign", authMiddleware, async (req, res) => {
  try {
    const {
      userId,
      leaveType,
      academicYear,
      totalDays,
    } = req.body;

    if (!userId || !leaveType || !academicYear || totalDays === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!Number.isFinite(Number(totalDays)) || Number(totalDays) < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total days",
      });
    }

    const type = await LeaveType.findOne({
      _id: leaveType,
      status: true,
    });

    if (!type) {
      return res.status(404).json({
        success: false,
        message: "Active leave type not found",
      });
    }

    const existing = await LeaveBalance.findOne({
      userId,
      leaveType,
      academicYear,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Leave balance already assigned",
      });
    }

    const balance = await LeaveBalance.create({
      userId,
      leaveType,
      academicYear,
      totalDays: Number(totalDays),
      usedDays: 0,
      remainingDays: Number(totalDays),
    });

    res.status(201).json({
      success: true,
      message: "Leave balance assigned successfully",
      data: balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Login User Leave Balance
router.get("/my-balance", authMiddleware, async (req, res) => {
  try {
    const { academicYear } = req.query;

    const filter = {
      userId: req.user.id,
      status: true,
    };

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const balances = await LeaveBalance.find(filter)
      .populate("leaveType")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get All Employee Leave Balances (Admin)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const { academicYear, userId } = req.query;

    const filter = {};

    if (academicYear) filter.academicYear = academicYear;
    if (userId) filter.userId = userId;

    const balances = await LeaveBalance.find(filter)
      .populate("userId")
      .populate("leaveType")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update Leave Entitlement (Admin)
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const { totalDays, status } = req.body;

    const balance = await LeaveBalance.findById(req.params.id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: "Leave balance not found",
      });
    }

    if (totalDays !== undefined) {
      const newTotal = Number(totalDays);

      if (
        !Number.isFinite(newTotal) ||
        newTotal < balance.usedDays
      ) {
        return res.status(400).json({
          success: false,
          message: "Total days cannot be less than used days",
        });
      }

      balance.totalDays = newTotal;
      balance.remainingDays = newTotal - balance.usedDays;
    }

    if (status !== undefined) {
      balance.status = status;
    }

    await balance.save();

    res.json({
      success: true,
      message: "Leave balance updated successfully",
      data: balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete Leave Balance (Admin)
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const balance = await LeaveBalance.findById(req.params.id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: "Leave balance not found",
      });
    }

    if (balance.usedDays > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete balance with used leaves",
      });
    }

    await balance.deleteOne();

    res.json({
      success: true,
      message: "Leave balance deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
