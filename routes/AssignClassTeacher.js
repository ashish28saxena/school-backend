const express = require("express");
const router = express.Router();

const AssignClassTeacher = require("../models/AssignClassTeacher");

// Assign Class Teacher
router.post("/submit", async (req, res) => {
  try {
    const {
      teacherID,
      classId,
      sectionId,
      academicYear,
      status
    } = req.body;

    if (!teacherID || !classId || !sectionId || !academicYear) {
      return res.status(400).json({
        status: 400,
        message: "All required fields are mandatory"
      });
    }

    // Check existing class teacher
    const existing = await AssignClassTeacher.findOne({
      classId,
      sectionId,
      academicYear,
      deletedAt: null
    });

    if (existing) {
      return res.status(409).json({
        status: 409,
        message: "Class Teacher already assigned to this class and section"
      });
    }

    const result = await AssignClassTeacher.create({
      teacherID,
      classId,
      sectionId,
      academicYear,
      status
    });

    res.status(201).json({
      status: 201,
      message: "Class Teacher assigned successfully",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});


// Get Assigned Class Teacher List
router.get("/", async (req, res) => {
  try {
    const result = await AssignClassTeacher.find({
      deletedAt: null
    })
      .populate("teacherID")
      .populate("classId")
      .populate("sectionId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Class Teacher fetched successfully",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});


// Delete Assignment (Soft Delete)
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await AssignClassTeacher.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found"
      });
    }

    res.status(200).json({
      status: 200,
      message: "Class Teacher assignment deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});

module.exports = router;