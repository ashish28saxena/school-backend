
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    bookName: {
      type: String,
      required: true,
      trim: true,
    },
    bookCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isbn: {
      type: String,
      default: "",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookCategory",
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    publisher: {
      type: String,
      default: "",
    },
    edition: {
      type: String,
      default: "",
    },
    publicationYear: {
      type: Number,
      default: null,
    },
    shelfNumber: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
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

module.exports = mongoose.model("Book", bookSchema);
