
const mongoose = require("mongoose");

const assignStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

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

    rollNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    academicYear: {
      type: String,
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ek student ka ek academic year mein ek hi active enrollment
assignStudentSchema.index(
  { studentId: 1, academicYear: 1 },
  {
    unique: true,
    partialFilterExpression: { status: true },
  }
);

// Ek section mein ek academic year mein roll number unique
assignStudentSchema.index(
  { classId: 1, sectionId: 1, academicYear: 1, rollNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { status: true },
  }
);

module.exports = mongoose.model("AssignStudent", assignStudentSchema);
