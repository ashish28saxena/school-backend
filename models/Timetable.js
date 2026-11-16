const mongoose = require("mongoose");

const periodSchema = new mongoose.Schema({
  periodNumber: {
    type: Number,
    required: true,
  },
  periodType: {
    type: String,
    enum: ["Teaching", "Break", "Lunch"],
    default: "Teaching",
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    default: null,
  },
  teacherID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: String,
    default: "",
  },
});

const timetableSchema = new mongoose.Schema(
  {
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
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    periods: [periodSchema],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One timetable per class, section, year and day
timetableSchema.index(
  { academicYear: 1, classId: 1, sectionId: 1, day: 1 },
  { unique: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);