
const mongoose = require("mongoose");

const teacherSalarySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    hra: { type: Number, default: 0, min: 0 },
    medicalAllowance: { type: Number, default: 0, min: 0 },
    transportAllowance: { type: Number, default: 0, min: 0 },
    otherAllowance: { type: Number, default: 0, min: 0 },

    pf: { type: Number, default: 0, min: 0 },
    professionalTax: { type: Number, default: 0, min: 0 },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

teacherSalarySchema.index(
  { teacherId: 1 },
  { unique: true }
);
module.exports = mongoose.model("TeacherSalary", teacherSalarySchema);
