
const express = require("express");
const router = express.Router();

const Leave = require("../models/Leave");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Leave Reports
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const role = String(req.user.role || "").toLowerCase();

    // Change these role names according to your project
    if (!["admin", "hr", "principal"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view leave reports"
      });
    }

    const {
      fromDate,
      toDate,
      status,
      leaveType,
      userId,
      search
    } = req.query;

    const filter = {};

    // Date range overlap filter
    if (fromDate || toDate) {
      filter.fromDate = {};
      filter.toDate = {};

      if (toDate) {
        filter.fromDate.$lte = new Date(`${toDate}T23:59:59.999`);
      }

      if (fromDate) {
        filter.toDate.$gte = new Date(`${fromDate}T00:00:00`);
      }
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (leaveType) {
      filter.leaveType = leaveType;
    }

    if (userId) {
      filter.userId = userId;
    }

    let query = Leave.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("leaveType", "leaveTypeName")
      .sort({ createdAt: -1 })
      .limit(5000);

    let leaves = await query;

    // Search by employee name/email
    if (search && search.trim()) {
      const keyword = search.trim().toLowerCase();

      leaves = leaves.filter((leave) => {
        const user = leave.userId;

        const name = user
          ? `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase()
          : "";

        const email = user?.email?.toLowerCase() || "";

        return (
          name.includes(keyword) ||
          email.includes(keyword)
        );
      });
    }

    const summary = {
      totalApplications: leaves.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      totalApprovedDays: 0,
      totalPendingDays: 0,
      totalRejectedDays: 0
    };

    leaves.forEach((leave) => {
      const days = Number(leave.totalDays || 0);

      if (leave.status === "Approved") {
        summary.approved++;
        summary.totalApprovedDays += days;
      } else if (leave.status === "Pending") {
        summary.pending++;
        summary.totalPendingDays += days;
      } else if (leave.status === "Rejected") {
        summary.rejected++;
        summary.totalRejectedDays += days;
      } else if (leave.status === "Cancelled") {
        summary.cancelled++;
      }
    });

    res.json({
      success: true,
      summary,
      count: leaves.length,
      data: leaves
    });

  } catch (error) {
    console.error("Leave Report Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
