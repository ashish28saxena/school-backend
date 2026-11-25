
const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    holidayName: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    holidayType: {
      type: String,
      enum: ["National", "Festival", "School", "Optional", "Other"],
      default: "School",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

holidaySchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Holiday", holidaySchema);
