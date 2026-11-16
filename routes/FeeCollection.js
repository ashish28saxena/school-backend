
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const FeeCollection = require("../models/FeeCollection");
const FeeStructure = require("../models/FeeStructure");
const AssignStudent = require("../models/AssignStudent");

const getFeeStructure = async (classId, sectionId, academicYear) => {
  // Prefer section-specific structure.
  let structure = null;

  if (sectionId) {
    structure = await FeeStructure.findOne({
      classId,
      sectionId,
      academicYear,
      status: true,
    });
  }

  // Otherwise use class-wide structure.
  if (!structure) {
    structure = await FeeStructure.findOne({
      classId,
      sectionId: null,
      academicYear,
      status: true,
    });
  }

  return structure;
};

const getPaidAmount = async (studentId, academicYear) => {
  const result = await FeeCollection.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        academicYear,
        status: true,
      },
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$amountPaid" },
      },
    },
  ]);

  return result[0]?.totalPaid || 0;
};

// GET students with fee details
router.get("/students", async (req, res) => {
  try {
    const { classId, sectionId, academicYear } = req.query;

    if (!classId || !academicYear) {
      return res.status(400).json({
        status: 400,
        message: "Class and academic year are required",
      });
    }

    const filter = {
      classId,
      academicYear,
      status: true,
    };

    // If section is selected, filter by that section.
    if (sectionId) {
      filter.sectionId = sectionId;
    }

    const assignments = await AssignStudent.find(filter)
      .populate("studentId")
      .populate("classId")
      .populate("sectionId");

    const students = [];

    for (const assignment of assignments) {
      if (!assignment.studentId) continue;

      const structure = await getFeeStructure(
        assignment.classId?._id || assignment.classId,
        assignment.sectionId?._id || assignment.sectionId,
        academicYear
      );

      if (!structure) continue;

      const paidAmount = await getPaidAmount(
        assignment.studentId._id,
        academicYear
      );

      const totalFee = structure.totalAmount || 0;

      students.push({
        assignmentId: assignment._id,
        student: assignment.studentId,
        class: assignment.classId,
        section: assignment.sectionId,
        rollNumber: assignment.rollNumber || "",
        feeStructureId: structure._id,
        totalFee,
        paidAmount,
        balance: Math.max(totalFee - paidAmount, 0),
        paymentStatus:
          paidAmount >= totalFee
            ? "Paid"
            : paidAmount > 0
            ? "Partial"
            : "Unpaid",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Students fee details fetched successfully",
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET all payment history
router.get("/", async (req, res) => {
  try {
    const result = await FeeCollection.find({ status: true })
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .populate("feeStructureId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      message: "Fee collection fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET student payment history
router.get("/student/:studentId", async (req, res) => {
  try {
    const result = await FeeCollection.find({
      studentId: req.params.studentId,
      status: true,
    })
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .sort({ paymentDate: -1 });

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

// SUBMIT payment
router.post("/submit", async (req, res) => {
  try {
    const {
      studentId,
      assignStudentId,
      feeStructureId,
      classId,
      sectionId,
      academicYear,
      amountPaid,
      paymentDate,
      paymentMode,
      transactionId,
      remarks,
    } = req.body;

    if (
      !studentId ||
      !assignStudentId ||
      !feeStructureId ||
      !classId ||
      !academicYear ||
      !amountPaid ||
      !paymentMode
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide all required payment details",
      });
    }

    if (!Number.isFinite(Number(amountPaid)) || Number(amountPaid) <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Payment amount must be greater than zero",
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
      status: true,
      classId,
      academicYear,
    });

    if (!structure) {
      return res.status(404).json({
        status: 404,
        message: "Active fee structure not found",
      });
    }

    const assignmentSectionId = assignment.sectionId
      ? assignment.sectionId.toString()
      : "";

    const structureSectionId = structure.sectionId
      ? structure.sectionId.toString()
      : "";

    if (
      structureSectionId &&
      structureSectionId !== assignmentSectionId
    ) {
      return res.status(400).json({
        status: 400,
        message: "Fee structure does not match student's section",
      });
    }

    const paidAmount = await getPaidAmount(studentId, academicYear);
    const balance = Number(structure.totalAmount) - paidAmount;

    if (Number(amountPaid) > balance) {
      return res.status(400).json({
        status: 400,
        message: `Payment exceeds pending balance of ${Math.max(balance, 0)}`,
      });
    }

    const receiptNumber =
      "FEE-" +
      Date.now() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    const result = await FeeCollection.create({
      receiptNumber,
      studentId,
      assignStudentId,
      feeStructureId,
      classId,
      sectionId: sectionId || null,
      academicYear,
      amountPaid: Number(amountPaid),
      paymentDate: paymentDate || new Date(),
      paymentMode,
      transactionId,
      remarks,
    });

    res.status(201).json({
      status: 201,
      message: "Fee payment collected successfully",
      data: result,
      totalFee: structure.totalAmount,
      paidAmount: paidAmount + Number(amountPaid),
      balance: balance - Number(amountPaid),
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// SOFT DELETE payment
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await FeeCollection.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Payment record not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Payment record deactivated successfully",
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
