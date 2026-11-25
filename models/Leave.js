
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    leaveType: {
      type: String,
      enum: [
        "Casual Leave",
        "Sick Leave",
        "Earned Leave",
        "Unpaid Leave",
        "Emergency Leave",
        "Other",
      ],
      required: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    totalDays: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },

    adminRemark: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

approvalFlow: [
  {
    role: {
      type: String,
      enum: ["hod", "principal", "admin"],
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Skipped"],
      default: "Pending"
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    actionDate: {
      type: Date,
      default: null
    },
    remark: {
      type: String,
      default: ""
    }
  }
],

currentApprovalLevel: {
  type: Number,
  default: 0
},

approvalHistory: [
  {
    role: String,
    action: {
      type: String,
      enum: ["Approved", "Rejected"]
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    remark: String,
    actionDate: {
      type: Date,
      default: Date.now
    }
  }
]

  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
