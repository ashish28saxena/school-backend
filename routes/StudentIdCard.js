
const express = require("express");
const router = express.Router();

const AssignStudent = require("../models/AssignStudent");

// GET STUDENTS FOR ID CARD
router.get("/students", async (req, res) => {
  try {
    const { classId, sectionId, academicYear } = req.query;

    if (!classId || !academicYear) {
      return res.status(400).json({
        status: 400,
        message: "Class and academic year are required",
      });
    }

    const filter = {
      classId,
      academicYear,
      status: true,
    };

    if (sectionId) {
      filter.sectionId = sectionId;
    }

    const result = await AssignStudent.find(filter)
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .sort({ rollNumber: 1 });

    const data = result
      .filter((item) => item.studentId)
      .map((item) => ({
        assignmentId: item._id,
        student: item.studentId,
        class: item.classId,
        section: item.sectionId,
        rollNumber: item.rollNumber || "",
        academicYear: item.academicYear,
      }));

    res.status(200).json({
      status: 200,
      message: "Students fetched successfully",
      total: data.length,
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
