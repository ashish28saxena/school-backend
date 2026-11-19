
const mongoose = require("mongoose");

const finePaymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },

    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookIssue",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
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

module.exports = mongoose.model("FinePayment", finePaymentSchema);
