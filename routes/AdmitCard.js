// routes/AdmitCard.js

const express = require("express");
const router = express.Router();

const ExamSchedule = require("../models/ExamSchedule");
const AssignStudent = require("../models/AssignStudent");

router.get("/data", async (req, res) => {
  try {
    const { examId, classId, sectionId } = req.query;

    if (!examId || !classId || !sectionId) {
      return res.status(400).json({
        status: 400,
        message: "Exam, Class and Section are required",
      });
    }

    const [schedules, assignments] = await Promise.all([
      ExamSchedule.find({
        examId,
        classId,
        sectionId,
        status: true,
      })
        .populate("examId")
        .populate("classId")
        .populate("sectionId")
        .populate("subjectId")
        .sort({ examDate: 1, startTime: 1 }),

      AssignStudent.find({
        classId,
        sectionId,
        status: true,
      }).populate("studentId"),
    ]);

    const students = assignments
      .filter((item) => item.studentId)
      .map((item) => ({
        assignmentId: item._id,
        student: item.studentId,
        rollNumber: item.rollNumber || "",
        academicYear: item.academicYear || "",
      }));

    return res.status(200).json({
      status: 200,
      message: "Admit card data fetched successfully",
      schedules,
      students,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;