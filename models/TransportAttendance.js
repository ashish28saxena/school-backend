
const mongoose = require("mongoose");

const transportAttendanceSchema = new mongoose.Schema(
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
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportRoute",
      required: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
    },
    pickupStatus: {
      type: String,
      enum: ["Pending", "Picked", "Absent"],
      default: "Pending",
    },
    pickupTime: {
      type: String,
    },
    dropStatus: {
      type: String,
      enum: ["Pending", "Dropped", "Absent"],
      default: "Pending",
    },
    dropTime: {
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

// One attendance record per student transport assignment per day
transportAttendanceSchema.index(
  { studentTransportId: 1, attendanceDate: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "TransportAttendance",
  transportAttendanceSchema
);
