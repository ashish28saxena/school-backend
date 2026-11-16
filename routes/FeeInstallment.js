
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const FeeInstallment = require("../models/FeeInstallment");
const AssignStudent = require("../models/AssignStudent");
const FeeStructure = require("../models/FeeStructure");
const FeeDiscount = require("../models/FeeDiscount");
const FeeCollection = require("../models/FeeCollection");

// Helper: section-specific fee structure first, otherwise class-wide.
async function getStudentFeeStructure(assignment) {
  let structure = null;

  if (assignment.sectionId) {
    structure = await FeeStructure.findOne({
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      academicYear: assignment.academicYear,
      status: true,
    });
  }

  if (!structure) {
    structure = await FeeStructure.findOne({
      classId: assignment.classId,
      sectionId: null,
      academicYear: assignment.academicYear,
      status: true,
    });
  }

  return structure;
}

// GET ALL INSTALLMENT PLANS
router.get("/", async (req, res) => {
  try {
    const filter = { status: true };

    if (req.query.academicYear) {
      filter.academicYear = req.query.academicYear;
    }

    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;
    if (req.query.studentId) filter.studentId = req.query.studentId;

    const result = await FeeInstallment.find(filter)
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .populate("feeStructureId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      message: "Installment plans fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// CREATE INSTALLMENT PLAN
router.post("/submit", async (req, res) => {
  try {
    const {
      assignStudentId,
      numberOfInstallments,
      frequency,
      firstDueDate,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(assignStudentId) ||
      !numberOfInstallments ||
      !firstDueDate
    ) {
      return res.status(400).json({
        status: 400,
        message: "Student assignment, installment count and first due date are required",
      });
    }

    const count = Number(numberOfInstallments);

    if (!Number.isInteger(count) || count < 1 || count > 24) {
      return res.status(400).json({
        status: 400,
        message: "Installments must be between 1 and 24",
      });
    }

    const assignment = await AssignStudent.findOne({
      _id: assignStudentId,
      status: true,
    });

    if (!assignment) {
      return res.status(404).json({
        status: 404,
        message: "Student assignment not found",
      });
    }

    const feeStructure = await getStudentFeeStructure(assignment);

    if (!feeStructure) {
      return res.status(404).json({
        status: 404,
        message: "Fee structure not found for this student",
      });
    }

    // Apply active discount, if available.
    const discount = await FeeDiscount.findOne({
      studentId: assignment.studentId,
      feeStructureId: feeStructure._id,
      academicYear: assignment.academicYear,
      status: true,
    });

    const discountAmount = discount ? Number(discount.discountAmount || 0) : 0;
    const totalFee = Math.max(
      Number(feeStructure.totalAmount) - discountAmount,
      0
    );

    const existingPlan = await FeeInstallment.findOne({
      studentId: assignment.studentId,
      feeStructureId: feeStructure._id,
      academicYear: assignment.academicYear,
      status: true,
    });

    if (existingPlan) {
      return res.status(409).json({
        status: 409,
        message: "Installment plan already exists for this student",
      });
    }

    const firstDate = new Date(firstDueDate);

    if (Number.isNaN(firstDate.getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Invalid first due date",
      });
    }

    const alreadyPaid = await FeeCollection.aggregate([
      {
        $match: {
          studentId: assignment.studentId,
          feeStructureId: feeStructure._id,
          academicYear: assignment.academicYear,
          status: true,
        },
      },
      {
        $group: {
          _id: null,
          paid: { $sum: "$amountPaid" },
        },
      },
    ]);

    const totalPaid = alreadyPaid[0]?.paid || 0;
    const totalDue = Math.max(totalFee - totalPaid, 0);

    if (totalPaid > totalFee) {
      return res.status(400).json({
        status: 400,
        message: "Already collected amount exceeds the discounted fee. Please review the existing payments.",
      });
    }

    // Split remaining fee evenly; last installment gets rounding remainder.
    const baseAmount = Math.floor((totalDue / count) * 100) / 100;
    let allocated = 0;

    const installments = Array.from({ length: count }, (_, index) => {
      const amount =
        index === count - 1
          ? Number((totalDue - allocated).toFixed(2))
          : baseAmount;

      allocated += amount;

      const dueDate = new Date(firstDate);
      const monthsToAdd =
        frequency === "Quarterly" ? index * 3 :
        frequency === "Half-Yearly" ? index * 6 :
        frequency === "Yearly" ? index * 12 : index;

      dueDate.setMonth(dueDate.getMonth() + monthsToAdd);

      return {
        installmentNumber: index + 1,
        installmentName: `Installment ${index + 1}`,
        amount,
        dueDate,
        paidAmount: 0,
        paymentStatus: amount === 0 ? "Paid" : "Pending",
      };
    });

    const plan = await FeeInstallment.create({
      studentId: assignment.studentId,
      assignStudentId: assignment._id,
      feeStructureId: feeStructure._id,
      classId: assignment.classId,
      sectionId: assignment.sectionId || null,
      academicYear: assignment.academicYear,
      totalFee,
      totalPaid,
      totalDue,
      installments,
    });

    res.status(201).json({
      status: 201,
      message: "Installment plan created successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET ONE STUDENT'S PLAN
router.get("/student/:studentId", async (req, res) => {
  try {
    const result = await FeeInstallment.find({
      studentId: req.params.studentId,
      status: true,
    })
      .populate("studentId")
      .populate("feeStructureId")
      .sort({ createdAt: -1 });

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

// PAY AN INSTALLMENT
router.post("/:planId/pay/:installmentId", async (req, res) => {
  try {
    const {
      amountPaid,
      paymentDate,
      paymentMode,
      transactionId,
      remarks,
    } = req.body;

    const amount = Number(amountPaid);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Enter a valid payment amount",
      });
    }

    const plan = await FeeInstallment.findOne({
      _id: req.params.planId,
      status: true,
    });

    if (!plan) {
      return res.status(404).json({
        status: 404,
        message: "Installment plan not found",
      });
    }

    const installment = plan.installments.id(req.params.installmentId);

    if (!installment) {
      return res.status(404).json({
        status: 404,
        message: "Installment not found",
      });
    }

    const remaining = Number(
      (installment.amount - installment.paidAmount).toFixed(2)
    );

    if (remaining <= 0) {
      return res.status(400).json({
        status: 400,
        message: "This installment is already paid",
      });
    }

    if (amount > remaining) {
      return res.status(400).json({
        status: 400,
        message: `Maximum payable amount is ${remaining}`,
      });
    }

    const receiptNumber =
      `FEE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create payment record so existing receipt/history APIs can use it.
    const payment = await FeeCollection.create({
      receiptNumber,
      studentId: plan.studentId,
      assignStudentId: plan.assignStudentId,
      feeStructureId: plan.feeStructureId,
      classId: plan.classId,
      sectionId: plan.sectionId,
      academicYear: plan.academicYear,
      amountPaid: amount,
      paymentDate: paymentDate || new Date(),
      paymentMode: paymentMode || "Cash",
      transactionId: transactionId || "",
      remarks: remarks || `Payment for ${installment.installmentName}`,
      status: true,
    });

    installment.paidAmount = Number(
      (installment.paidAmount + amount).toFixed(2)
    );

    installment.feeCollectionId = payment._id;

    if (installment.paidAmount >= installment.amount) {
      installment.paymentStatus = "Paid";
      installment.paidDate = payment.paymentDate;
    } else {
      installment.paymentStatus = "Partial";
    }

    plan.totalPaid = Number((plan.totalPaid + amount).toFixed(2));
    plan.totalDue = Math.max(
      Number((plan.totalFee - plan.totalPaid).toFixed(2)),
      0
    );

    await plan.save();

    res.status(200).json({
      status: 200,
      message: "Installment payment recorded successfully",
      receiptNumber,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// SOFT DELETE PLAN
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await FeeInstallment.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Installment plan not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Installment plan deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;
