
const mongoose = require("mongoose");

const feeDiscountSchema = new mongoose.Schema(
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
    discountType: {
      type: String,
      enum: ["Fixed", "Percentage"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

feeDiscountSchema.index(
  { studentId: 1, feeStructureId: 1, academicYear: 1 },
  {
    unique: true,
    partialFilterExpression: { status: true },
  }
);

module.exports = mongoose.model("FeeDiscount", feeDiscountSchema);
