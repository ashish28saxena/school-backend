
const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseType: {
      type: String,
      enum: ["LMV", "HMV", "Transport", "Other"],
      required: true,
    },
    licenseExpiryDate: {
      type: Date,
      required: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);