const express = require("express");
const router = express.Router();

const ExamSchedule = require("../models/ExamSchedule");

const isValidSchedule = (body) => {
  const {
    examId,
    academicYear,
    classId,
    sectionId,
    subjectId,
    examDate,
    startTime,
    endTime,
    maxMarks,
    passingMarks,
  } = body;

  if (
    !examId ||
    !academicYear ||
    !classId ||
    !sectionId ||
    !subjectId ||
    !examDate ||
    !startTime ||
    !endTime ||
    maxMarks === undefined ||
    passingMarks === undefined
  ) {
    return "Please fill all required fields";
  }

  if (startTime >= endTime) {
    return "End time must be after start time";
  }

  if (
    Number(maxMarks) <= 0 ||
    Number(passingMarks) < 0 ||
    Number(passingMarks) > Number(maxMarks)
  ) {
    return "Please enter valid maximum and passing marks";
  }

  if (Number.isNaN(new Date(examDate).getTime())) {
    return "Invalid exam date";
  }

  return null;
};

// GET all schedules
router.get("/", async (req, res) => {
  try {
    const result = await ExamSchedule.find()
      .populate("examId", "examName examType academicYear")
      .populate("classId", "className")
      .populate("sectionId", "sectionName")
      .populate("subjectId", "subjectName subjectCode")
      .sort({ examDate: 1, startTime: 1 });

    res.status(200).json({
      status: 200,
      message: "Exam schedules fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET single schedule
router.get("/:id", async (req, res) => {
  try {
    const result = await ExamSchedule.findById(req.params.id)
      .populate("examId")
      .populate("classId")
      .populate("sectionId")
      .populate("subjectId");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Schedule not found",
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

// ADD schedule
router.post("/submit", async (req, res) => {
  try {
    const validationError = isValidSchedule(req.body);

    if (validationError) {
      return res.status(400).json({
        status: 400,
        message: validationError,
      });
    }

    const result = await ExamSchedule.create(req.body);

    res.status(201).json({
      status: 201,
      message: "Exam schedule added successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "This subject is already scheduled for this exam, class and section"
          : error.message,
    });
  }
});

// UPDATE schedule
router.put("/update/:id", async (req, res) => {
  try {
    const validationError = isValidSchedule(req.body);

    if (validationError) {
      return res.status(400).json({
        status: 400,
        message: validationError,
      });
    }

    const result = await ExamSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Schedule not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Exam schedule updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "This subject is already scheduled for this exam, class and section"
          : error.message,
    });
  }
});

// DELETE schedule
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await ExamSchedule.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Schedule not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Exam schedule deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;