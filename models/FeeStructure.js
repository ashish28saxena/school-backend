
const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    fees: [
      {
        feeType: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
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

feeStructureSchema.pre("save", function () {
  this.totalAmount = this.fees.reduce(
    (total, fee) => total + Number(fee.amount || 0),
    0
  );
});

feeStructureSchema.index(
  { classId: 1, sectionId: 1, academicYear: 1 },
  {
    unique: true,
    partialFilterExpression: { status: true },
  }
);

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
