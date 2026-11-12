
const express = require("express");
const router = express.Router();

const Subject = require("../models/Subject");


router.get("/", async (req, res) => {
  try {
    const result = await Subject.find().sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Subject fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET: Fetch single subject
router.get("/:id", async (req, res) => {
  try {
    const result = await Subject.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Subject fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// POST: Add subject
router.post("/submit", async (req, res) => {
  try {
    const {
      subjectName,
      subjectCode,
      subjectType,
      description,
      status,
    } = req.body;

    if (!subjectName || !subjectCode) {
      return res.status(400).json({
        status: 400,
        message: "Subject name and subject code are required",
      });
    }

    const existingSubject = await Subject.findOne({
      subjectCode: subjectCode.trim().toUpperCase(),
    });

    if (existingSubject) {
      return res.status(409).json({
        status: 409,
        message: "Subject code already exists",
      });
    }

    const result = await Subject.create({
      subjectName: subjectName.trim(),
      subjectCode: subjectCode.trim().toUpperCase(),
      subjectType: subjectType || "Core",
      description: description || "",
      status: status ?? true,
    });

    res.status(201).json({
      status: 201,
      message: "Subject added successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "Subject code already exists",
      });
    }

    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// PUT: Update subject
router.put("/update/:id", async (req, res) => {
  try {
    const {
      subjectName,
      subjectCode,
      subjectType,
      description,
      status,
    } = req.body;

    if (!subjectName || !subjectCode) {
      return res.status(400).json({
        status: 400,
        message: "Subject name and subject code are required",
      });
    }

    const existingSubject = await Subject.findOne({
      subjectCode: subjectCode.trim().toUpperCase(),
      _id: { $ne: req.params.id },
    });

    if (existingSubject) {
      return res.status(409).json({
        status: 409,
        message: "Subject code already exists",
      });
    }

    const result = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        subjectName: subjectName.trim(),
        subjectCode: subjectCode.trim().toUpperCase(),
        subjectType: subjectType || "Core",
        description: description || "",
        status: status ?? true,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Subject updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 409,
        message: "Subject code already exists",
      });
    }

    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// DELETE: Deactivate subject
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await Subject.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Subject deactivated successfully",
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
