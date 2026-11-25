
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Holiday = require("../models/Holiday");
const authMiddleware = require("../middleware/authMiddleware");

// Authentication
router.use(authMiddleware);

// Admin authorization
// Agar aapke JWT mein roleId aata hai, to is check ko
// apne ACL/Role middleware se replace karein.
const adminOnly = (req, res, next) => {
  const role = String(req.user?.role || req.user?.roleName || "").toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can manage holidays",
    });
  }

  next();
};

// GET: All holidays with optional filters
router.get("/all", async (req, res) => {
  try {
    const { year, holidayType, status } = req.query;

    const filter = {};

    if (holidayType) filter.holidayType = holidayType;

    if (status !== undefined) {
      filter.status = status === "true";
    }

    if (year) {
      const selectedYear = Number(year);

      if (!Number.isInteger(selectedYear) || selectedYear < 1900) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }

      const yearStart = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
      const yearEnd = new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`);

      // Holidays that overlap the selected calendar year
      filter.startDate = { $lt: yearEnd };
      filter.endDate = { $gte: yearStart };
    }

    const holidays = await Holiday.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET: Active holidays
router.get("/active", async (req, res) => {
  try {
    const holidays = await Holiday.find({ status: true })
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET: Single holiday
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST: Add holiday (Admin only)
router.post("/add", adminOnly, async (req, res) => {
  try {
    const {
      holidayName,
      startDate,
      endDate,
      holidayType,
      description,
      isOptional,
      status,
    } = req.body;

    if (!holidayName || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Holiday name, start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday date",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const holiday = await Holiday.create({
      holidayName,
      startDate: start,
      endDate: end,
      holidayType,
      description,
      isOptional,
      status,
      createdBy: req.user?.id || req.user?._id || req.user?.userId,
    });

    res.status(201).json({
      success: true,
      message: "Holiday added successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// PUT: Update holiday (Admin only)
router.put("/update/:id", adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    const {
      holidayName,
      startDate,
      endDate,
      holidayType,
      description,
      isOptional,
      status,
    } = req.body;

    const existingHoliday = await Holiday.findById(req.params.id);

    if (!existingHoliday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    const nextStart = startDate
      ? new Date(startDate)
      : existingHoliday.startDate;

    const nextEnd = endDate
      ? new Date(endDate)
      : existingHoliday.endDate;

    if (
      Number.isNaN(nextStart.getTime()) ||
      Number.isNaN(nextEnd.getTime()) ||
      nextEnd < nextStart
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid holiday dates",
      });
    }

    const updatedHoliday = await Holiday.findByIdAndUpdate(
      req.params.id,
      {
        ...(holidayName !== undefined && { holidayName }),
        startDate: nextStart,
        endDate: nextEnd,
        ...(holidayType !== undefined && { holidayType }),
        ...(description !== undefined && { description }),
        ...(isOptional !== undefined && { isOptional }),
        ...(status !== undefined && { status }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: updatedHoliday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE: Delete holiday (Admin only)
router.delete("/delete/:id", adminOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
