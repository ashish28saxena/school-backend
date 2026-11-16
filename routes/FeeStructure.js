
const express = require("express");
const router = express.Router();

const FeeStructure = require("../models/FeeStructure");

const populateFields = (query) =>
  query.populate("classId").populate("sectionId");

// GET all fee structures
router.get("/", async (req, res) => {
  try {
    const result = await populateFields(
      FeeStructure.find({ status: true }).sort({ _id: -1 })
    );

    res.status(200).json({
      status: 200,
      message: "Fee structures fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET fee structure by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await populateFields(
      FeeStructure.findById(req.params.id)
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Fee structure not found",
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

// ADD fee structure
router.post("/submit", async (req, res) => {
  try {
    const { classId, sectionId, academicYear, fees, description } = req.body;

    if (!classId || !academicYear || !Array.isArray(fees) || !fees.length) {
      return res.status(400).json({
        status: 400,
        message: "Class, academic year and fee details are required",
      });
    }

    for (const fee of fees) {
      if (
        !fee.feeType ||
        fee.amount === undefined ||
        fee.amount === null ||
        !Number.isFinite(Number(fee.amount)) ||
        Number(fee.amount) < 0
      ) {
        return res.status(400).json({
          status: 400,
          message: "Each fee must have a valid fee type and amount",
        });
      }
    }

    const result = await FeeStructure.create({
      classId,
      sectionId: sectionId || null,
      academicYear,
      fees,
      description,
    });

    res.status(201).json({
      status: 201,
      message: "Fee structure added successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "An active fee structure already exists for this class, section and academic year"
          : error.message,
    });
  }
});

// UPDATE fee structure
router.put("/update/:id", async (req, res) => {
  try {
    const { classId, sectionId, academicYear, fees, description } = req.body;

    if (!classId || !academicYear || !Array.isArray(fees) || !fees.length) {
      return res.status(400).json({
        status: 400,
        message: "Class, academic year and fee details are required",
      });
    }

    for (const fee of fees) {
      if (
        !fee.feeType ||
        fee.amount === undefined ||
        fee.amount === null ||
        !Number.isFinite(Number(fee.amount)) ||
        Number(fee.amount) < 0
      ) {
        return res.status(400).json({
          status: 400,
          message: "Each fee must have a valid fee type and amount",
        });
      }
    }

    const result = await FeeStructure.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Fee structure not found",
      });
    }

    result.classId = classId;
    result.sectionId = sectionId || null;
    result.academicYear = academicYear;
    result.fees = fees;
    result.description = description || "";

    await result.save();

    res.status(200).json({
      status: 200,
      message: "Fee structure updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message:
        error.code === 11000
          ? "An active fee structure already exists for this class, section and academic year"
          : error.message,
    });
  }
});

// PERMANENT DELETE
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await FeeStructure.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Fee structure not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Fee structure deleted successfully",
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
