const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      default: null,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    // Role name from Role collection
    role: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Role collection ID
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    // Student / Teacher / Parent reference
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique email only when email exists
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: "string" },
    },
  }
);

// Unique mobile only when mobile exists
userSchema.index(
  { mobileNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      mobileNumber: { $type: "string" },
    },
  }
);

module.exports = mongoose.model("User", userSchema);