
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Homework = require("../models/Homework");
const authMiddleware = require("../middleware/authMiddleware");


router.use(authMiddleware);

// ADD HOMEWORK
router.post("/add", async (req, res) => {
  try {
    const {
      title,
      description,
      classId,
      sectionId,
      subjectId,
      teacherId,
      dueDate,
      academicSession,
      attachment,
      totalMarks,
    } = req.body;

    if (
      !title ||
      !description ||
      !classId ||
      !sectionId ||
      !subjectId ||
      !teacherId ||
      !dueDate ||
      !academicSession
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const homework = await Homework.create({
      title,
      description,
      classId,
      sectionId,
      subjectId,
      teacherId,
      dueDate,
      academicSession,
      attachment: attachment || "",
      totalMarks: totalMarks || 0,
    });

    res.status(201).json({
      success: true,
      message: "Homework added successfully",
      data: homework,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ALL HOMEWORK WITH FILTERS
router.get("/", async (req, res) => {
  try {
    const { classId, sectionId, subjectId, teacherId, session } = req.query;

    const filter = {};

    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;
    if (session) filter.academicSession = session;

    const homework = await Homework.find(filter)
      .populate("classId", "className")
      .populate("sectionId", "sectionName")
      .populate("subjectId", "subjectName")
      .populate("teacherId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: homework.length,
      data: homework,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET HOMEWORK BY ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid homework ID" });
    }

    const homework = await Homework.findById(req.params.id)
      .populate("classId", "className")
      .populate("sectionId", "sectionName")
      .populate("subjectId", "subjectName")
      .populate("teacherId");

    if (!homework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE HOMEWORK
router.put("/update/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid homework ID" });
    }

    const homework = await Homework.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!homework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    res.json({
      success: true,
      message: "Homework updated successfully",
      data: homework,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE HOMEWORK
router.delete("/delete/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid homework ID" });
    }

    const homework = await Homework.findByIdAndDelete(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    res.json({
      success: true,
      message: "Homework deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
