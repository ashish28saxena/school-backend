
const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ["Bus", "Van", "Car", "Other"],
      required: true,
    },
    vehicleModel: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registrationDate: {
      type: Date,
    },
    insuranceExpiryDate: {
      type: Date,
    },
    fitnessExpiryDate: {
      type: Date,
    },
    description: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
