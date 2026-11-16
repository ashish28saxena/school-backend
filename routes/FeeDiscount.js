
const express = require("express");
const router = express.Router();

const FeeDiscount = require("../models/FeeDiscount");
const FeeStructure = require("../models/FeeStructure");
const AssignStudent = require("../models/AssignStudent");

const calculateDiscount = (type, value, totalFee) => {
  if (type === "Percentage") {
    return Math.round((totalFee * value / 100) * 100) / 100;
  }
  return Number(value);
};

// GET all discounts
router.get("/", async (req, res) => {
  try {
    const result = await FeeDiscount.find({ status: true })
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .populate("feeStructureId")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 200, data: result });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// ADD discount
router.post("/submit", async (req, res) => {
  try {
    const {
      studentId,
      assignStudentId,
      feeStructureId,
      classId,
      sectionId,
      academicYear,
      discountType,
      discountValue,
      reason,
    } = req.body;

    if (
      !studentId || !assignStudentId || !feeStructureId ||
      !classId || !academicYear || !discountType ||
      discountValue === undefined
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide all required fields",
      });
    }

    const value = Number(discountValue);

    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      !["Fixed", "Percentage"].includes(discountType) ||
      (discountType === "Percentage" && value > 100)
    ) {
      return res.status(400).json({
        status: 400,
        message: "Enter a valid discount type and value",
      });
    }

    const assignment = await AssignStudent.findOne({
      _id: assignStudentId,
      studentId,
      classId,
      academicYear,
      status: true,
    });

    if (!assignment) {
      return res.status(404).json({
        status: 404,
        message: "Active student assignment not found",
      });
    }

    const structure = await FeeStructure.findOne({
      _id: feeStructureId,
      classId,
      academicYear,
      status: true,
    });

    if (!structure) {
      return res.status(404).json({
        status: 404,
        message: "Fee structure not found",
      });
    }

    const assignmentSection = assignment.sectionId?.toString() || "";
    const structureSection = structure.sectionId?.toString() || "";

    if (structureSection && structureSection !== assignmentSection) {
      return res.status(400).json({
        status: 400,
        message: "Fee structure does not match student's section",
      });
    }

    const discountAmount = calculateDiscount(
      discountType,
      value,
      structure.totalAmount
    );

    if (discountAmount > structure.totalAmount) {
      return res.status(400).json({
        status: 400,
        message: "Discount cannot exceed total fee",
      });
    }

    const result = await FeeDiscount.create({
      studentId,
      assignStudentId,
      feeStructureId,
      classId,
      sectionId: sectionId || null,
      academicYear,
      discountType,
      discountValue: value,
      discountAmount,
      reason,
    });

    res.status(201).json({
      status: 201,
      message: "Fee discount added successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      status: error.code === 11000 ? 409 : 500,
      message: error.code === 11000
        ? "Discount already exists for this student and fee structure"
        : error.message,
    });
  }
});

// UPDATE discount
router.put("/update/:id", async (req, res) => {
  try {
    const discount = await FeeDiscount.findOne({
      _id: req.params.id,
      status: true,
    });

    if (!discount) {
      return res.status(404).json({
        status: 404,
        message: "Discount not found",
      });
    }

    const type = req.body.discountType;
    const value = Number(req.body.discountValue);

    if (
      !["Fixed", "Percentage"].includes(type) ||
      !Number.isFinite(value) ||
      value <= 0 ||
      (type === "Percentage" && value > 100)
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid discount type or value",
      });
    }

    const structure = await FeeStructure.findById(discount.feeStructureId);

    if (!structure || !structure.status) {
      return res.status(404).json({
        status: 404,
        message: "Fee structure not found",
      });
    }

    const discountAmount = calculateDiscount(
      type,
      value,
      structure.totalAmount
    );

    if (discountAmount > structure.totalAmount) {
      return res.status(400).json({
        status: 400,
        message: "Discount cannot exceed total fee",
      });
    }

    discount.discountType = type;
    discount.discountValue = value;
    discount.discountAmount = discountAmount;
    discount.reason = req.body.reason || "";

    await discount.save();

    res.status(200).json({
      status: 200,
      message: "Discount updated successfully",
      data: discount,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// SOFT DELETE
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await FeeDiscount.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Discount not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Discount deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

module.exports = router;
