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

// GET result by exam, class and section
router.get("/", async (req, res) => {
  try {
    const { examId, classId, sectionId, academicYear } = req.query;

    if (!examId || !classId || !sectionId || !academicYear) {
      return res.status(400).json({
        status: 400,
        message: "Exam, class, section and academic year are required",
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        status: 404,
        message: "Exam not found",
      });
    }

    const schedules = await ExamSchedule.find({
      examId,
      classId,
      sectionId,
      academicYear,
      status: true,
    }).populate("subjectId", "subjectName");

    if (!schedules.length) {
      return res.status(200).json({
        status: 200,
        exam,
        data: [],
        message: "No exam schedules found",
      });
    }

    const scheduleIds = schedules.map((item) => item._id);

    const [assignments, marks] = await Promise.all([
      AssignStudent.find({
        classId,
        sectionId,
        academicYear,
        status: true,
      }).populate("studentId"),

      ExamMark.find({
        examId,
        classId,
        sectionId,
        academicYear,
        examScheduleId: { $in: scheduleIds },
        status: true,
      }),
    ]);

    const markMap = new Map();

    marks.forEach((mark) => {
      markMap.set(
        `${mark.examScheduleId}_${mark.studentId}`,
        mark
      );
    });

    const data = assignments
      .filter((assignment) => assignment.studentId)
      .map((assignment) => {
        const student = assignment.studentId;

        let totalMarks = 0;
        let obtainedMarks = 0;
        let allSubjectsPassed = true;
        let completedSubjects = 0;

        const subjects = schedules.map((schedule) => {
          const mark = markMap.get(
            `${schedule._id}_${student._id}`
          );

          const max = Number(schedule.maxMarks);
          const obtained = mark
            ? Number(mark.obtainedMarks)
            : 0;

          totalMarks += max;
          obtainedMarks += obtained;

          const passed = Boolean(
            mark &&
              mark.attendanceStatus === "Present" &&
              obtained >= Number(schedule.passingMarks)
          );

          if (mark) completedSubjects++;

          if (!passed) allSubjectsPassed = false;

          return {
            scheduleId: schedule._id,
            subjectId: schedule.subjectId?._id,
            subjectName: schedule.subjectId?.subjectName,
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

        return {
          studentId: student._id,
          student,
          rollNumber: assignment.rollNumber || "",
          totalMarks,
          obtainedMarks,
          percentage,
          grade: getGrade(percentage),
          result:
            allSubjectsPassed && completedSubjects === schedules.length
              ? "Pass"
              : "Fail",
          subjects,
        };
      });

    data.sort((a, b) => b.percentage - a.percentage);

    data.forEach((item, index) => {
      item.rank = index + 1;
    });

    res.status(200).json({
      status: 200,
      exam,
      schedules,
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;