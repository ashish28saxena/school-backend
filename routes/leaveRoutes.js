
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Leave = require("../models/Leave");
const authMiddleware = require("../middleware/authMiddleware");

// Apply Leave
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave dates",
      });
    }

    const totalDays =
      Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      userId: req.user.id,
      leaveType,
      fromDate: start,
      toDate: end,
      totalDays,
      reason,
      approvalFlow: [
  { role: "hod", status: "Pending" },
  { role: "principal", status: "Pending" },
  { role: "admin", status: "Pending" }
],
currentApprovalLevel: 0,
approvalHistory: []
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get All Leaves (Admin)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate("userId")
        .populate("approvedBy")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      Leave.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: leaves,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Login User Leaves
router.get("/my-leaves", authMiddleware, async (req, res) => {
  try {
    const leaves = await Leave.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Leave By ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await Leave.findById(req.params.id)
      .populate("userId")
      .populate("approvedBy");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    res.json({
      success: true,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Approve Leave (Admin)
router.put("/approve/:id", authMiddleware, async (req, res) => {
  try {
    const { adminRemark = "" } = req.body;

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be approved",
      });
    }

    leave.status = "Approved";
    leave.adminRemark = adminRemark;
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();

    await leave.save();

    res.json({
      success: true,
      message: "Leave approved successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Reject Leave (Admin)
router.put("/reject/:id", authMiddleware, async (req, res) => {
  try {
    const { adminRemark = "" } = req.body;

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be rejected",
      });
    }

    leave.status = "Rejected";
    leave.adminRemark = adminRemark;
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date();

    await leave.save();

    res.json({
      success: true,
      message: "Leave rejected successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Cancel Leave (Applicant)
router.put("/cancel/:id", authMiddleware, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel this leave",
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be cancelled",
      });
    }

    leave.status = "Cancelled";
    await leave.save();

    res.json({
      success: true,
      message: "Leave cancelled successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete Leave (Admin)
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    res.json({
      success: true,
      message: "Leave deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
