const mongoose = require("mongoose");

const examScheduleSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    academicYear: {
      type: String,
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
    examDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    passingMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    roomNumber: {
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

// Same subject should not be scheduled twice for same exam/class/section
examScheduleSchema.index(
  {
    examId: 1,
    classId: 1,
    sectionId: 1,
    subjectId: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("ExamSchedule", examScheduleSchema);