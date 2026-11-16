
const mongoose = require("mongoose");

const feeCollectionSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },

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

    amountPaid: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Online"],
      required: true,
    },

    transactionId: {
      type: String,
      default: "",
    },

    remarks: {
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

feeCollectionSchema.index({
  studentId: 1,
  academicYear: 1,
  status: 1,
});

module.exports = mongoose.model("FeeCollection", feeCollectionSchema);
