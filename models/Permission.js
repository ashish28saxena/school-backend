const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", permissionSchema);