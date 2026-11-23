
const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema(
  {
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    relation: {
      type: String,
      enum: ["Father", "Mother", "Guardian"],
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    alternateMobileNumber: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    occupation: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Parent", parentSchema);
