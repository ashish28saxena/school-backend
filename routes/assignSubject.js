
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const AssignSubject = require("../models/AssignSubject");

// GET: Fetch all assigned subjects
router.get("/", async (req, res) => {
  try {
    const result = await AssignSubject.find()
      .populate("teacherID")
      .populate("classId")
      .populate("sectionId")
      .populate("subjectId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Assigned subjects fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// POST: Assign Subject
router.post("/submit", async (req, res) => {
  try {
    const {
      teacherID,
      classId,
      sectionId,
      subjectId,
      academicYear,
      status,
    } = req.body;

    if (
      !teacherID ||
      !classId ||
      !sectionId ||
      !subjectId ||
      !academicYear
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please fill all required fields",
      });
    }

    const ids = [teacherID, classId, sectionId, subjectId];

    if (!ids.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        status: 400,
        message: "Invalid ID provided",
      });
    }

    const isActive = status !== false;

    if (isActive) {
      const existing = await AssignSubject.findOne({
        classId,
        sectionId,
        subjectId,
        academicYear,
        status: true,
      });

      if (existing) {
        return res.status(409).json({
          status: 409,
          message: "This subject is already assigned to this class and section",
        });
      }
    }

    const result = await AssignSubject.create({
      teacherID,
      classId,
      sectionId,
      subjectId,
      academicYear,
      status: isActive,
    });

    res.status(201).json({
      status: 201,
      message: "Subject assigned successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "This subject is already assigned to this class and section",
      });
    }

    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// PUT: Update assigned subject
router.put("/update/:id", async (req, res) => {
  try {
    const {
      teacherID,
      classId,
      sectionId,
      subjectId,
      academicYear,
      status,
    } = req.body;

    if (
      !teacherID ||
      !classId ||
      !sectionId ||
      !subjectId ||
      !academicYear
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please fill all required fields",
      });
    }

    const ids = [teacherID, classId, sectionId, subjectId];

    if (!ids.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        status: 400,
        message: "Invalid ID provided",
      });
    }

    const current = await AssignSubject.findById(req.params.id);

    if (!current) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found",
      });
    }

    const isActive = status !== false;

    if (isActive) {
      const duplicate = await AssignSubject.findOne({
        _id: { $ne: req.params.id },
        classId,
        sectionId,
        subjectId,
        academicYear,
        status: true,
      });

      if (duplicate) {
        return res.status(409).json({
          status: 409,
          message: "This subject is already assigned to this class and section",
        });
      }
    }

    const result = await AssignSubject.findByIdAndUpdate(
      req.params.id,
      {
        teacherID,
        classId,
        sectionId,
        subjectId,
        academicYear,
        status: isActive,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 200,
      message: "Assignment updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "Duplicate subject assignment",
      });
    }

    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// DELETE: Deactivate assignment
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await AssignSubject.findByIdAndUpdate(
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
      message: "Subject assignment deactivated successfully",
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
