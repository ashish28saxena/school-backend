
const mongoose = require("mongoose");

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    answer: {
      type: String,
      default: "",
    },
    attachment: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Submitted", "Late", "Checked", "Rejected"],
      default: "Submitted",
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// One submission per student per homework
homeworkSubmissionSchema.index(
  { homeworkId: 1, studentId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "HomeworkSubmission",
  homeworkSubmissionSchema
);
