const mongoose = require("mongoose");

const assignClassTeacherSchema = new mongoose.Schema(
  {
    teacherID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true
    },

    academicYear: {
      type: String,
      required: true
    },

    status: {
      type: Boolean,
      default: true
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// One active class teacher per class, section and year
assignClassTeacherSchema.index(
  { classId: 1, sectionId: 1, academicYear: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null }
  }
);

module.exports = mongoose.model(
  "AssignClassTeacher",
  assignClassTeacherSchema
);