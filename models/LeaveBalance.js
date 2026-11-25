
const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    totalDays: {
      type: Number,
      required: true,
      min: 0,
    },

    usedDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

leaveBalanceSchema.index(
  { userId: 1, leaveType: 1, academicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "LeaveBalance",
  leaveBalanceSchema
);
