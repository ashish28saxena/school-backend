
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const authMiddleware = require("../middleware/authMiddleware");

// Current user's role and ID
const getUserRole = (req) =>
  String(req.user.role || "").toLowerCase();

const getUserId = (req) =>
  req.user.id || req.user.userId || req.user._id;

// Academic year: April to March
const getAcademicYear = (dateValue) => {
  const date = new Date(dateValue);
  const year =
    date.getMonth() >= 3
      ? date.getFullYear()
      : date.getFullYear() - 1;

  return `${year}-${String(year + 1).slice(-2)}`;
};

// GET: Pending approvals for logged-in role
router.get("/pending", authMiddleware, async (req, res) => {
  try {
    const role = getUserRole(req);

    if (!["hod", "principal", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view approvals"
      });
    }

    const leaves = await Leave.find({
      status: "Pending",
      "approvalFlow.role": role,
      "approvalFlow.status": "Pending",
      currentApprovalLevel: {
        $gte: 0
      }
    })
      .populate("userId", "firstName lastName email")
      .populate("leaveType", "leaveTypeName")
      .sort({ createdAt: -1 });

    // Only show applications where this role is the current step
    const pendingLeaves = leaves.filter((leave) => {
      const currentStep =
        leave.approvalFlow[leave.currentApprovalLevel];

      return (
        currentStep &&
        currentStep.role === role &&
        currentStep.status === "Pending"
      );
    });

    res.json({
      success: true,
      count: pendingLeaves.length,
      data: pendingLeaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST: Approve leave
router.put("/approve/:id", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    const remark = req.body.remark || "";

    if (!["hod", "principal", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to approve leaves"
      });
    }

    let responseLeave;

    await session.withTransaction(async () => {
      const leave = await Leave.findById(req.params.id).session(session);

      if (!leave) {
        throw new Error("Leave application not found");
      }

      if (leave.status !== "Pending") {
        throw new Error("This leave is no longer pending");
      }

      const step = leave.approvalFlow[leave.currentApprovalLevel];

      if (!step || step.role !== role || step.status !== "Pending") {
        throw new Error("This leave is not assigned to your approval level");
      }

      step.status = "Approved";
      step.approvedBy = userId;
      step.actionDate = new Date();
      step.remark = remark;

      leave.approvalHistory.push({
        role,
        action: "Approved",
        actionBy: userId,
        remark,
        actionDate: new Date()
      });

      leave.currentApprovalLevel += 1;

      // All approval levels completed
      if (leave.currentApprovalLevel >= leave.approvalFlow.length) {
        const academicYear = getAcademicYear(leave.fromDate);

        // Atomically check and deduct available balance
        const balance = await LeaveBalance.findOneAndUpdate(
          {
            userId: leave.userId,
            leaveType: leave.leaveType,
            academicYear,
            status: true,
            remainingDays: { $gte: leave.totalDays }
          },
          {
            $inc: {
              usedDays: leave.totalDays,
              remainingDays: -leave.totalDays
            }
          },
          {
            new: true,
            session
          }
        );

        if (!balance) {
          throw new Error(
            "Insufficient leave balance or leave balance record not found"
          );
        }

        leave.status = "Approved";
        leave.approvedBy = userId;
        leave.approvedAt = new Date();
        leave.adminRemark = remark;
      }

      await leave.save({ session });
      responseLeave = leave;
    });

    res.json({
      success: true,
      message:
        responseLeave.status === "Approved"
          ? "Leave fully approved and balance deducted"
          : "Leave approved at your level. Forwarded to next approver",
      data: responseLeave
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    await session.endSession();
  }
});

// POST: Reject leave
router.put("/reject/:id", authMiddleware, async (req, res) => {
  try {
    const role = getUserRole(req);
    const userId = getUserId(req);
    const remark = req.body.remark || "";

    if (!["hod", "principal", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reject leaves"
      });
    }

    if (!remark.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection remark is required"
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave application not found"
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This leave is no longer pending"
      });
    }

    const step = leave.approvalFlow[leave.currentApprovalLevel];

    if (!step || step.role !== role || step.status !== "Pending") {
      return res.status(403).json({
        success: false,
        message: "This leave is not assigned to your approval level"
      });
    }

    step.status = "Rejected";
    step.approvedBy = userId;
    step.actionDate = new Date();
    step.remark = remark;

    leave.approvalHistory.push({
      role,
      action: "Rejected",
      actionBy: userId,
      remark,
      actionDate: new Date()
    });

    leave.status = "Rejected";
    leave.adminRemark = remark;

    await leave.save();

    res.json({
      success: true,
      message: "Leave rejected successfully",
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET: Approval history for one leave
router.get("/history/:id", authMiddleware, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("approvalHistory.actionBy", "firstName lastName email")
      .populate("approvalFlow.approvedBy", "firstName lastName email");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    res.json({
      success: true,
      data: {
        approvalFlow: leave.approvalFlow,
        approvalHistory: leave.approvalHistory,
        currentApprovalLevel: leave.currentApprovalLevel,
        status: leave.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
