const express = require("express");
const router = express.Router();

const Timetable = require("../models/Timetable");
const mongoose = require("mongoose");

// GET all timetables
router.get("/", async (req, res) => {
  try {
    const result = await Timetable.find()
      .populate("classId")
      .populate("sectionId")
      .populate("periods.subjectId")
      .populate("periods.teacherID")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Timetable fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET timetable by filters
router.get("/filter", async (req, res) => {
  try {
    const { classId, sectionId, academicYear } = req.query;

    const filter = {};

    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (academicYear) filter.academicYear = academicYear;

    const result = await Timetable.find(filter)
      .populate("classId")
      .populate("sectionId")
      .populate("periods.subjectId")
      .populate("periods.teacherID")
      .sort({ day: 1 });

    res.status(200).json({
      status: 200,
      message: "Timetable fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET single timetable
router.get("/:id", async (req, res) => {
  try {
    const result = await Timetable.findById(req.params.id)
      .populate("classId")
      .populate("sectionId")
      .populate("periods.subjectId")
      .populate("periods.teacherID");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Timetable not found",
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

// Validate periods
const validatePeriods = (periods) => {
  if (!Array.isArray(periods) || periods.length === 0) {
    return "Please add at least one period";
  }

  const sorted = [...periods].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];

    if (!p.startTime || !p.endTime || p.startTime >= p.endTime) {
      return "Invalid period start or end time";
    }

    if (p.periodType === "Teaching" && (!p.subjectId || !p.teacherID)) {
      return "Subject and teacher are required for teaching periods";
    }

    if (i > 0 && sorted[i - 1].endTime > p.startTime) {
      return "Periods cannot overlap";
    }
  }

  return null;
};

// POST create timetable
router.post("/submit", async (req, res) => {
  try {
    const {
      academicYear,
      classId,
      sectionId,
      day,
      periods,
      status,
    } = req.body;

    if (!academicYear || !classId || !sectionId || !day) {
      return res.status(400).json({
        status: 400,
        message: "Academic year, class, section and day are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid class or section ID",
      });
    }

    const validationError = validatePeriods(periods);

    if (validationError) {
      return res.status(400).json({
        status: 400,
        message: validationError,
      });
    }

    const result = await Timetable.create({
      academicYear,
      classId,
      sectionId,
      day,
      periods,
      status: status ?? true,
    });

    res.status(201).json({
      status: 201,
      message: "Timetable created successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "Timetable already exists for this class, section and day"
          : error.message,
    });
  }
});

// PUT update timetable
router.put("/update/:id", async (req, res) => {
  try {
    const validationError = validatePeriods(req.body.periods);

    if (validationError) {
      return res.status(400).json({
        status: 400,
        message: validationError,
      });
    }

    const result = await Timetable.findByIdAndUpdate(
      req.params.id,
      {
        academicYear: req.body.academicYear,
        classId: req.body.classId,
        sectionId: req.body.sectionId,
        day: req.body.day,
        periods: req.body.periods,
        status: req.body.status,
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Timetable updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "Timetable already exists for this class, section and day"
          : error.message,
    });
  }
});

// DELETE - soft delete
router.delete("/delete/:id", async (req, res) => {
  try {
    // const result = await Timetable.findByIdAndUpdate(
    //   req.params.id,
    //   { status: false },
    //   { new: true }
    // );

    const result = await Timetable.deleteOne({
      _id: req.params.id
    });

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Timetable not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Timetable deactivated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const result = await Timetable.find({
      academicYear: req.query.academicYear,
      status: true,
      "periods.teacherID": req.params.teacherId,
    })
      .populate("classId")
      .populate("sectionId")
      .populate("periods.subjectId")
      .populate("periods.teacherID");

    const data = result.map((item) => ({
      day: item.day,
      className: item.classId?.className,
      sectionName: item.sectionId?.sectionName,
      periods: item.periods.filter(
        (p) =>
          String(p.teacherID?._id || p.teacherID) ===
          req.params.teacherId
      ),
    }));

    res.json({
      status: 200,
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

const AssignStudent = require("../models/AssignStudent");

router.get("/student/:studentId", async (req, res) => {
  try {
    const assignment = await AssignStudent.findOne({
      studentId: req.params.studentId,
      academicYear: req.query.academicYear,
      status: true,
    });

    if (!assignment) {
      return res.status(404).json({
        status: 404,
        message: "Student class assignment not found",
      });
    }

    const result = await Timetable.find({
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      academicYear: req.query.academicYear,
      status: true,
    })
      .populate("classId")
      .populate("sectionId")
      .populate("periods.subjectId")
      .populate("periods.teacherID");

    res.json({
      status: 200,
      message: "Student timetable fetched successfully",
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