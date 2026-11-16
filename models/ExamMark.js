const mongoose = require("mongoose");

const examMarkSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    examScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSchedule",
      required: true,
    },
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    attendanceStatus: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
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

examMarkSchema.index(
  { examScheduleId: 1, studentId: 1 },
  { unique: true }
);

module.exports = mongoose.model("ExamMark", examMarkSchema);