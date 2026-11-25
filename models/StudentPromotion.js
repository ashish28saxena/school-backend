
const mongoose = require("mongoose");

const studentPromotionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    fromClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    fromSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    toClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    toSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    fromAcademicYear: {
      type: String,
      required: true,
    },

    toAcademicYear: {
      type: String,
      required: true,
    },

    promotionStatus: {
      type: String,
      enum: ["Promoted", "Detained"],
      default: "Promoted",
    },

    remarks: {
      type: String,
      default: "",
    },

    promotedAt: {
      type: Date,
      default: Date.now,
    },

    promotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

studentPromotionSchema.index(
  { studentId: 1, toAcademicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "StudentPromotion",
  studentPromotionSchema
);
