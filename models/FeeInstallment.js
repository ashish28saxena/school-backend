
const mongoose = require("mongoose");

const installmentItemSchema = new mongoose.Schema(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    installmentName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Partial", "Paid", "Overdue"],
      default: "Pending",
    },
    feeCollectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeCollection",
      default: null,
    },
  },
  { timestamps: true }
);

const feeInstallmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    assignStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignStudent",
      required: true,
    },
    feeStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    academicYear: {
      type: String,
      required: true,
    },
    totalFee: {
      type: Number,
      required: true,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    totalDue: {
      type: Number,
      required: true,
    },
    installments: [installmentItemSchema],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One active plan per student, fee structure and academic year.
feeInstallmentSchema.index(
  { studentId: 1, feeStructureId: 1, academicYear: 1 },
  {
    unique: true,
    partialFilterExpression: { status: true },
  }
);

module.exports = mongoose.model("FeeInstallment", feeInstallmentSchema);
