const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const ExamMark = require("../models/ExamMark");
const ExamSchedule = require("../models/ExamSchedule");
const AssignStudent = require("../models/AssignStudent");

// Get students for selected exam schedule
router.get("/students/:scheduleId", async (req, res) => {
  try {
    const schedule = await ExamSchedule.findById(req.params.scheduleId)
      .populate("subjectId", "subjectName")
      .populate("classId", "className")
      .populate("sectionId", "sectionName")
      .populate("examId", "examName");

    if (!schedule) {
      return res.status(404).json({
        status: 404,
        message: "Exam schedule not found",
      });
    }

    const assignments = await AssignStudent.find({
      classId: schedule.classId._id,
      sectionId: schedule.sectionId._id,
      academicYear: schedule.academicYear,
      status: true,
    }).populate("studentId");

    const marks = await ExamMark.find({
      examScheduleId: schedule._id,
    });

    const markMap = new Map(
      marks.map((mark) => [String(mark.studentId), mark])
    );

    const students = assignments
      .filter((item) => item.studentId)
      .map((item) => {
        const mark = markMap.get(String(item.studentId._id));

        return {
          student: item.studentId,
          assignmentId: item._id,
          markId: mark?._id || null,
          obtainedMarks: mark?.obtainedMarks ?? 0,
          attendanceStatus: mark?.attendanceStatus || "Present",
          remarks: mark?.remarks || "",
        };
      });

    res.status(200).json({
      status: 200,
      message: "Students fetched successfully",
      schedule,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// Save marks in bulk
router.post("/submit", async (req, res) => {
  try {
    const { examScheduleId, marks } = req.body;

    if (
      !examScheduleId ||
      !mongoose.isValidObjectId(examScheduleId) ||
      !Array.isArray(marks) ||
      marks.length === 0
    ) {
      return res.status(400).json({
        status: 400,
        message: "Valid schedule and marks are required",
      });
    }

    const schedule = await ExamSchedule.findById(examScheduleId);

    if (!schedule) {
      return res.status(404).json({
        status: 404,
        message: "Exam schedule not found",
      });
    }

    const studentIds = marks.map((item) => String(item.studentId));

    if (
      studentIds.some((id) => !mongoose.isValidObjectId(id)) ||
      new Set(studentIds).size !== studentIds.length
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid or duplicate student IDs",
      });
    }

    // Only students assigned to this class, section and year can receive marks
    const assignments = await AssignStudent.find({
      studentId: { $in: studentIds },
      classId: schedule.classId,
      sectionId: schedule.sectionId,
      academicYear: schedule.academicYear,
      status: true,
    });

    const allowedStudents = new Set(
      assignments.map((item) => String(item.studentId))
    );

    const operations = [];

    for (const item of marks) {
      const studentId = String(item.studentId);
      const attendanceStatus = item.attendanceStatus || "Present";
      const obtainedMarks = Number(item.obtainedMarks);

      if (!allowedStudents.has(studentId)) {
        return res.status(400).json({
          status: 400,
          message: `Student ${studentId} is not assigned to this class and section`,
        });
      }

      if (!["Present", "Absent"].includes(attendanceStatus)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid attendance status",
        });
      }

      if (
        attendanceStatus === "Absent"
          ? obtainedMarks !== 0
          : !Number.isFinite(obtainedMarks) ||
            obtainedMarks < 0 ||
            obtainedMarks > schedule.maxMarks
      ) {
        return res.status(400).json({
          status: 400,
          message: "Invalid obtained marks",
        });
      }

      operations.push({
        updateOne: {
          filter: {
            examScheduleId: schedule._id,
            studentId: item.studentId,
          },
          update: {
            $set: {
              examId: schedule.examId,
              examScheduleId: schedule._id,
              studentId: item.studentId,
              classId: schedule.classId,
              sectionId: schedule.sectionId,
              subjectId: schedule.subjectId,
              academicYear: schedule.academicYear,
              obtainedMarks:
                attendanceStatus === "Absent" ? 0 : obtainedMarks,
              attendanceStatus,
              remarks: item.remarks || "",
              status: true,
            },
          },
          upsert: true,
        },
      });
    }

    await ExamMark.bulkWrite(operations);

    res.status(200).json({
      status: 200,
      message: "Student marks saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;