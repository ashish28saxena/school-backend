
const express = require("express");
const router = express.Router();

const BookCategory = require("../models/BookCategory");
const Book = require("../models/Book");
const BookIssue = require("../models/BookIssue");

// ================= CATEGORY APIs =================

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const data = await BookCategory.find({ status: true }).sort({
      categoryName: 1,
    });

    res.status(200).json({ status: 200, data });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// Add category
router.post("/category/submit", async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    if (!categoryName) {
      return res.status(400).json({
        status: 400,
        message: "Category name is required",
      });
    }

    const exists = await BookCategory.findOne({
      categoryName: categoryName.trim(),
    });

    if (exists) {
      return res.status(409).json({
        status: 409,
        message: "Category already exists",
      });
    }

    const result = await BookCategory.create({
      categoryName,
      description,
    });

    res.status(201).json({
      status: 201,
      message: "Category added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// Update category
router.put("/category/update/:id", async (req, res) => {
  try {
    const result = await BookCategory.findByIdAndUpdate(
      req.params.id,
      {
        categoryName: req.body.categoryName,
        description: req.body.description,
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Category not found",
      });
    }

    res.json({
      status: 200,
      message: "Category updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// Soft delete category
router.delete("/category/delete/:id", async (req, res) => {
  try {
    const result = await BookCategory.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Category not found",
      });
    }

    res.json({ status: 200, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// ================= BOOK APIs =================

// Get books
router.get("/books", async (req, res) => {
  try {
    const filter = { status: true };

    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }

    const data = await Book.find(filter)
      .populate("categoryId", "categoryName")
      .sort({ createdAt: -1 });

    res.json({ status: 200, data });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// Add book
router.post("/book/submit", async (req, res) => {
  try {
    const {
      bookName,
      bookCode,
      isbn,
      categoryId,
      author,
      publisher,
      edition,
      publicationYear,
      shelfNumber,
      price,
      totalCopies,
      description,
    } = req.body;

    if (
      !bookName ||
      !bookCode ||
      !categoryId ||
      !author ||
      Number(totalCopies) < 1
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide all required book details",
      });
    }

    const category = await BookCategory.findOne({
      _id: categoryId,
      status: true,
    });

    if (!category) {
      return res.status(404).json({
        status: 404,
        message: "Active category not found",
      });
    }

    const exists = await Book.findOne({ bookCode });

    if (exists) {
      return res.status(409).json({
        status: 409,
        message: "Book code already exists",
      });
    }

    const result = await Book.create({
      bookName,
      bookCode,
      isbn,
      categoryId,
      author,
      publisher,
      edition,
      publicationYear,
      shelfNumber,
      price,
      totalCopies: Number(totalCopies),
      availableCopies: Number(totalCopies),
      description,
    });

    res.status(201).json({
      status: 201,
      message: "Book added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// Update book
router.put("/book/update/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book || !book.status) {
      return res.status(404).json({
        status: 404,
        message: "Book not found",
      });
    }

    const newTotal = req.body.totalCopies !== undefined
      ? Number(req.body.totalCopies)
      : book.totalCopies;

    const issuedCopies = book.totalCopies - book.availableCopies;

    if (!Number.isInteger(newTotal) || newTotal < issuedCopies) {
      return res.status(400).json({
        status: 400,
        message: `Total copies cannot be less than ${issuedCopies} issued copies`,
      });
    }

    const updateData = { ...req.body };
    delete updateData.availableCopies;

    updateData.totalCopies = newTotal;
    updateData.availableCopies = newTotal - issuedCopies;

    const result = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      status: 200,
      message: "Book updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// Soft delete book (only if no copies are issued)
router.delete("/book/delete/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 404,
        message: "Book not found",
      });
    }

    if (book.availableCopies !== book.totalCopies) {
      return res.status(400).json({
        status: 400,
        message: "Return all issued copies before deleting this book",
      });
    }

    book.status = false;
    await book.save();

    res.json({ status: 200, message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// ================= ISSUE BOOK =================

router.post("/issue", async (req, res) => {
  try {
    const {
      bookId,
      studentId,
      assignStudentId,
      issueDate,
      dueDate,
      finePerDay,
      remarks,
    } = req.body;

    if (!bookId || !studentId || !dueDate) {
      return res.status(400).json({
        status: 400,
        message: "Book, student and due date are required",
      });
    }

    const due = new Date(dueDate);
    const issuedOn = issueDate ? new Date(issueDate) : new Date();

    if (
      Number.isNaN(due.getTime()) ||
      Number.isNaN(issuedOn.getTime()) ||
      due < issuedOn
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide a valid due date",
      });
    }

    // Atomically reserve one available copy
    const book = await Book.findOneAndUpdate(
      {
        _id: bookId,
        status: true,
        availableCopies: { $gt: 0 },
      },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!book) {
      return res.status(400).json({
        status: 400,
        message: "Book is unavailable or not found",
      });
    }

    try {
      const issue = await BookIssue.create({
        bookId,
        studentId,
        assignStudentId: assignStudentId || null,
        issueDate: issuedOn,
        dueDate: due,
        finePerDay: finePerDay === undefined ? 5 : Number(finePerDay),
        remarks,
      });

      return res.status(201).json({
        status: 201,
        message: "Book issued successfully",
        data: issue,
      });
    } catch (error) {
      // Restore stock if issue record creation fails
      await Book.findByIdAndUpdate(bookId, {
        $inc: { availableCopies: 1 },
      });
      throw error;
    }
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// Get issue records
router.get("/issues", async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.bookId) filter.bookId = req.query.bookId;

    const data = await BookIssue.find(filter)
      .populate("bookId", "bookName bookCode")
      .populate("studentId")
      .sort({ createdAt: -1 });

    res.json({ status: 200, data });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// ================= RETURN BOOK =================

router.post("/return/:id", async (req, res) => {
  try {
    const issue = await BookIssue.findOne({
      _id: req.params.id,
      status: "Issued",
    });

    if (!issue) {
      return res.status(404).json({
        status: 404,
        message: "Active issue record not found or book already returned",
      });
    }

    const returnDate = req.body.returnDate
      ? new Date(req.body.returnDate)
      : new Date();

    if (Number.isNaN(returnDate.getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Invalid return date",
      });
    }

    const lateDays = Math.max(
      0,
      Math.ceil(
        (returnDate.getTime() - issue.dueDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const fineAmount = lateDays * issue.finePerDay;

    // Conditional update prevents a duplicate return
    const result = await BookIssue.findOneAndUpdate(
      { _id: issue._id, status: "Issued" },
      {
        status: "Returned",
        returnDate,
        fineAmount,
      },
      { new: true }
    );

    if (!result) {
      return res.status(409).json({
        status: 409,
        message: "This book has already been returned",
      });
    }

    await Book.findByIdAndUpdate(issue.bookId, {
      $inc: { availableCopies: 1 },
    });

    res.json({
      status: 200,
      message: "Book returned successfully",
      data: result,
      lateDays,
      fineAmount,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// ================= LIBRARY REPORT =================

router.get("/reports", async (req, res) => {
  try {
    const [books, issued, overdue, returned] = await Promise.all([
      Book.aggregate([
        { $match: { status: true } },
        {
          $group: {
            _id: null,
            totalTitles: { $sum: 1 },
            totalCopies: { $sum: "$totalCopies" },
            availableCopies: { $sum: "$availableCopies" },
          },
        },
      ]),
      BookIssue.countDocuments({ status: "Issued" }),
      BookIssue.countDocuments({
        status: "Issued",
        dueDate: { $lt: new Date() },
      }),
      BookIssue.countDocuments({ status: "Returned" }),
    ]);

    res.json({
      status: 200,
      data: {
        totalTitles: books[0]?.totalTitles || 0,
        totalCopies: books[0]?.totalCopies || 0,
        availableCopies: books[0]?.availableCopies || 0,
        issuedBooks: issued,
        overdueBooks: overdue,
        returnedBooks: returned,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

module.exports = router;
