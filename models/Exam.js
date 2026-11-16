const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true,
    },
    examType: {
      type: String,
      enum: [
        "Unit Test",
        "Monthly Test",
        "Quarterly",
        "Half Yearly",
        "Annual",
        "Final",
        "Other",
      ],
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: {
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

examSchema.index(
  { examName: 1, academicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model("Exam", examSchema);