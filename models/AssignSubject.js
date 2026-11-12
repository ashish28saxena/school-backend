
const mongoose = require("mongoose");

const assignSubjectSchema = new mongoose.Schema(
  {
    teacherID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
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

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One active teacher assignment per subject/class/section/year
assignSubjectSchema.index(
  {
    classId: 1,
    sectionId: 1,
    subjectId: 1,
    academicYear: 1,
  },
  {
    unique: true,
    partialFilterExpression: { status: true },
  }
);

module.exports = mongoose.model(
  "AssignSubject",
  assignSubjectSchema
);
