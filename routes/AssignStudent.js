
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const AssignStudent = require("../models/AssignStudent");

// GET: All assigned students
router.get("/", async (req, res) => {
  try {
    const result = await AssignStudent.find()
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Assigned students fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// POST: Assign student
router.post("/submit", async (req, res) => {
  try {
    const {
      studentId,
      classId,
      sectionId,
      rollNumber,
      academicYear,
      status,
    } = req.body;

    if (
      !studentId ||
      !classId ||
      !sectionId ||
      !rollNumber ||
      !academicYear
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please fill all required fields",
      });
    }

    const duplicateStudent = await AssignStudent.findOne({
      studentId,
      academicYear,
      status: true,
    });

    if (duplicateStudent) {
      return res.status(409).json({
        status: 409,
        message: "This student is already assigned in this academic year",
      });
    }

    const duplicateRollNumber = await AssignStudent.findOne({
      classId,
      sectionId,
      academicYear,
      rollNumber: Number(rollNumber),
      status: true,
    });

    if (duplicateRollNumber) {
      return res.status(409).json({
        status: 409,
        message: "This roll number is already assigned in this class and section",
      });
    }

    const result = await AssignStudent.create({
      studentId,
      classId,
      sectionId,
      rollNumber: Number(rollNumber),
      academicYear,
      status: status ?? true,
    });

    res.status(201).json({
      status: 201,
      message: "Student assigned successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "Duplicate student enrollment or roll number",
      });
    }

    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET: Single assigned student
router.get("/:id", async (req, res) => {
  try {
    const result = await AssignStudent.findById(req.params.id)
      .populate("studentId")
      .populate("classId")
      .populate("sectionId");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// PUT: Update assignment
router.put("/update/:id", async (req, res) => {
  try {
    const {
      studentId,
      classId,
      sectionId,
      rollNumber,
      academicYear,
      status,
    } = req.body;

    const existing = await AssignStudent.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found",
      });
    }

    const duplicateStudent = await AssignStudent.findOne({
      _id: { $ne: req.params.id },
      studentId,
      academicYear,
      status: true,
    });

    if (duplicateStudent) {
      return res.status(409).json({
        status: 409,
        message: "Student is already assigned in this academic year",
      });
    }

    const duplicateRoll = await AssignStudent.findOne({
      _id: { $ne: req.params.id },
      classId,
      sectionId,
      academicYear,
      rollNumber: Number(rollNumber),
      status: true,
    });

    if (duplicateRoll) {
      return res.status(409).json({
        status: 409,
        message: "Roll number already exists in this section",
      });
    }

    const result = await AssignStudent.findByIdAndUpdate(
      req.params.id,
      {
        studentId,
        classId,
        sectionId,
        rollNumber: Number(rollNumber),
        academicYear,
        status: status ?? true,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 200,
      message: "Assignment updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// DELETE: Deactivate assignment (history remains saved)
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await AssignStudent.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Student assignment deactivated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;
