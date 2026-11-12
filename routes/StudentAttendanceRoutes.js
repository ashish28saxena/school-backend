
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const StudentAttendance = require("../models/StudentAttendance");

// ======================================
// 1. SUBMIT / UPDATE STUDENT ATTENDANCE
// POST /api/studentattendance/submit
// ======================================

router.post("/submit", async (req, res) => {
  try {
    const {
      classId,
      sectionId,
      attendenceDate,
      studentAttendence,
    } = req.body;

    if (!classId || !sectionId || !attendenceDate) {
      return res.status(400).json({
        status: 400,
        message: "Class, Section and Date are required",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(attendenceDate)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    if (
      !Array.isArray(studentAttendence) ||
      studentAttendence.length === 0
    ) {
      return res.status(400).json({
        status: 400,
        message: "Student attendance is required",
      });
    }

    const validStatuses = ["Present", "Absent", "Leave"];

    const studentIds = studentAttendence.map(
      (item) => String(item.studentId)
    );

    if (
      studentIds.some((id) => !mongoose.Types.ObjectId.isValid(id)) ||
      new Set(studentIds).size !== studentIds.length
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid or duplicate student ID",
      });
    }

    const invalidRecord = studentAttendence.some(
      (item) =>
        !validStatuses.includes(item.status || "Present")
    );

    if (invalidRecord) {
      return res.status(400).json({
        status: 400,
        message: "Invalid attendance status",
      });
    }

    const formattedAttendance = studentAttendence.map((item) => ({
      studentId: item.studentId,
      status: item.status || "Present",
      remarks: item.remarks || "",
    }));

    const result = await StudentAttendance.findOneAndUpdate(
      {
        classId,
        sectionId,
        attendenceDate,
      },
      {
        $set: {
          studentAttendence: formattedAttendance,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      status: 200,
      message: "Student attendance saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Student attendance submit error:", error);

    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// ======================================
// 2. GET ATTENDANCE BY CLASS, SECTION, DATE
// GET /api/studentattendance/get
// ======================================

router.get("/get", async (req, res) => {
  try {
    const { classId, sectionId, attendenceDate } = req.query;

    if (!classId || !sectionId || !attendenceDate) {
      return res.status(400).json({
        status: 400,
        message: "Class, Section and Date are required",
      });
    }

    const result = await StudentAttendance.findOne({
      classId,
      sectionId,
      attendenceDate,
    })
      .populate(
        "studentAttendence.studentId",
        "firstName lastName admissionNumber StudentPhoto"
      )
      .populate("classId", "className")
      .populate("sectionId", "sectionName");

    return res.status(200).json({
      status: 200,
      message: result
        ? "Attendance found"
        : "No attendance found",
      data: result,
    });
  } catch (error) {
    console.error("Get attendance error:", error);

    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// ======================================
// 3. STUDENT ATTENDANCE HISTORY
// GET /history/:studentId
// ======================================

router.get("/history/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid student ID",
      });
    }

    const result = await StudentAttendance.aggregate([
      {
        $unwind: "$studentAttendence",
      },
      {
        $match: {
          "studentAttendence.studentId":
            new mongoose.Types.ObjectId(studentId),
        },
      },
      {
        $project: {
          classId: 1,
          sectionId: 1,
          attendenceDate: 1,
          status: "$studentAttendence.status",
          remarks: "$studentAttendence.remarks",
        },
      },
      {
        $sort: {
          attendenceDate: -1,
        },
      },
    ]);

    return res.status(200).json({
      status: 200,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Attendance history error:", error);

    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;
