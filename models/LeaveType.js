
const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema(
  {
    leaveTypeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    totalDays: {
      type: Number,
      default: 0,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
