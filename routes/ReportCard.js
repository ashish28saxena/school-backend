const express = require("express");
const router = express.Router();

const Exam = require("../models/Exam");
const ExamSchedule = require("../models/ExamSchedule");
const ExamMark = require("../models/ExamMark");
const AssignStudent = require("../models/AssignStudent");

function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 45) return "D";
  if (percentage >= 33) return "E";
  return "F";
}

router.get("/:studentId", async (req, res) => {
  try {
    const { examId, academicYear } = req.query;
    const { studentId } = req.params;

    if (!examId || !academicYear) {
      return res.status(400).json({
        status: 400,
        message: "Exam and academic year are required",
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        status: 404,
        message: "Exam not found",
      });
    }

    const assignment = await AssignStudent.findOne({
      studentId,
      academicYear,
      status: true,
    })
      .populate("studentId")
      .populate("classId", "className")
      .populate("sectionId", "sectionName");

    if (!assignment) {
      return res.status(404).json({
        status: 404,
        message: "Student assignment not found",
      });
    }

    const schedules = await ExamSchedule.find({
      examId,
      classId: assignment.classId._id,
      sectionId: assignment.sectionId._id,
      academicYear,
      status: true,
    }).populate("subjectId", "subjectName subjectCode");

    const marks = await ExamMark.find({
      examId,
      studentId,
      academicYear,
      status: true,
    });

    const markMap = new Map(
      marks.map((mark) => [
        String(mark.examScheduleId),
        mark,
      ])
    );

    let totalMarks = 0;
    let obtainedMarks = 0;
    let allPassed = schedules.length > 0;

    const subjects = schedules.map((schedule) => {
      const mark = markMap.get(String(schedule._id));
      const max = Number(schedule.maxMarks);
      const obtained = mark ? Number(mark.obtainedMarks) : 0;

      totalMarks += max;
      obtainedMarks += obtained;

      const passed = Boolean(
        mark &&
          mark.attendanceStatus === "Present" &&
          obtained >= Number(schedule.passingMarks)
      );

      if (!passed) allPassed = false;

      return {
        subjectName: schedule.subjectId?.subjectName || "Subject",
        subjectCode: schedule.subjectId?.subjectCode || "",
        maxMarks: max,
        passingMarks: schedule.passingMarks,
        obtainedMarks: obtained,
        attendanceStatus: mark?.attendanceStatus || "Not Entered",
        remarks: mark?.remarks || "",
        result: passed ? "Pass" : "Fail",
      };
    });

    const percentage =
      totalMarks > 0
        ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2))
        : 0;

    res.status(200).json({
      status: 200,
      data: {
        exam,
        academicYear,
        student: assignment.studentId,
        className: assignment.classId?.className,
        sectionName: assignment.sectionId?.sectionName,
        rollNumber: assignment.rollNumber || "",
        subjects,
        totalMarks,
        obtainedMarks,
        percentage,
        grade: getGrade(percentage),
        result: allPassed ? "Pass" : "Fail",
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;