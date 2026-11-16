const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam");

// Get all exams
router.get("/", async (req, res) => {
  try {
    const result = await Exam.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      message: "Exam fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// Get single exam
router.get("/:id", async (req, res) => {
  try {
    const result = await Exam.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Exam not found",
      });
    }

    res.status(200).json({ status: 200, data: result });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// Add exam
router.post("/submit", async (req, res) => {
  try {
    const {
      examName,
      examType,
      academicYear,
      startDate,
      endDate,
      description,
      status,
    } = req.body;

    if (
      !examName ||
      !examType ||
      !academicYear ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please fill all required fields",
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        status: 400,
        message: "End date cannot be before start date",
      });
    }

    const result = await Exam.create({
      examName,
      examType,
      academicYear,
      startDate,
      endDate,
      description,
      status,
    });

    res.status(201).json({
      status: 201,
      message: "Exam added successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "This exam already exists for this academic year"
          : error.message,
    });
  }
});

// Update exam
router.put("/update/:id", async (req, res) => {
  try {
    const {
      examName,
      examType,
      academicYear,
      startDate,
      endDate,
      description,
      status,
    } = req.body;

    if (
      !examName ||
      !examType ||
      !academicYear ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please fill all required fields",
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        status: 400,
        message: "End date cannot be before start date",
      });
    }

    const result = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        examName,
        examType,
        academicYear,
        startDate,
        endDate,
        description,
        status,
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Exam not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Exam updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "This exam already exists for this academic year"
          : error.message,
    });
  }
});

// Delete exam
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await Exam.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Exam not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;