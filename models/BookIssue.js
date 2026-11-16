
const mongoose = require("mongoose");

const bookIssueSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    assignStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignStudent",
      default: null,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    finePerDay: {
      type: Number,
      default: 5,
      min: 0,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Issued", "Returned"],
      default: "Issued",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookIssue", bookIssueSchema);
