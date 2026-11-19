const mongoose = require("mongoose");

const vehicleMaintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    maintenanceType: {
      type: String,
      enum: ["Service", "Repair", "Insurance", "Fitness", "Other"],
      required: true,
    },

    serviceDate: {
      type: Date,
      required: true,
    },

    nextServiceDate: {
      type: Date,
      default: null,
    },

    odometerReading: {
      type: Number,
      min: 0,
      default: 0,
    },

    workshopName: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      min: 0,
      default: 0,
    },

    description: {
      type: String,
      trim: true,
    },

    documentUrl: {
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

module.exports = mongoose.model(
  "VehicleMaintenance",
  vehicleMaintenanceSchema
);