
const mongoose = require("mongoose");

const transportFeeSchema = new mongoose.Schema(
  {
    studentTransportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentTransport",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    billingMonth: {
      type: String, // YYYY-MM
      required: true,
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Partial", "Paid"],
      default: "Pending",
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

transportFeeSchema.index(
  { studentTransportId: 1, billingMonth: 1 },
  { unique: true }
);

module.exports = mongoose.model("TransportFee", transportFeeSchema);
