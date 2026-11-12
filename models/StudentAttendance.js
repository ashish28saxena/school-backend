
const mongoose = require("mongoose");

const studentAttendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    attendenceDate: {
      type: String,
      required: true,
    },

    studentAttendence: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },

        status: {
          type: String,
          enum: ["Present", "Absent", "Leave"],
          default: "Present",
        },

        remarks: {
          type: String,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate attendance for same class, section and date
studentAttendanceSchema.index(
  { classId: 1, sectionId: 1, attendenceDate: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema
);
