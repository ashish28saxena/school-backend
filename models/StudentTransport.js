
const mongoose = require("mongoose");

const studentTransportSchema = new mongoose.Schema(
  {
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
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportRoute",
      required: true,
    },
    pickupPointId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
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
  "StudentTransport",
  studentTransportSchema
);
