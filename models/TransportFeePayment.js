
const mongoose = require("mongoose");

const transportFeePaymentSchema = new mongoose.Schema(
  {
    transportFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportFee",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 1,
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
    },
    remarks: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TransportFeePayment",
  transportFeePaymentSchema
);
