const mongoose = require("mongoose");

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },
    attendanceDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Leave", "Half Day", "Late"],
      required: true
    },
    checkIn: {
      type: String,
      default: ""
    },
    checkOut: {
      type: String,
      default: ""
    },
    remarks: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Prevents duplicate attendance for the same teacher on the same date
// and makes the bulk upsert fast and race-safe
teacherAttendanceSchema.index(
  { teacherId: 1, attendanceDate: 1 },
  { unique: true }
);

module.exports = mongoose.model("TeacherAttendance", teacherAttendanceSchema);