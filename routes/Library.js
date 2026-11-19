
const express = require("express");
const router = express.Router();

const BookCategory = require("../models/BookCategory");
const Book = require("../models/Book");
const BookIssue = require("../models/BookIssue");
const AssignStudent = require("../models/AssignStudent");
const FinePayment = require("../models/FinePayment");


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



// Get students class-wise from AssignStudent
router.get("/students", async (req, res) => {
  try {
    const { classId, academicYear } = req.query;

    if (!classId) {
      return res.status(400).json({
        status: 400,
        message: "Class ID is required",
      });
    }

    const filter = {
      classId,
      status: true,
    };

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const data = await AssignStudent.find(filter)
      .populate("studentId")
      .populate("classId", "className")
      .populate("sectionId", "sectionName")
      .sort({ rollNumber: 1 });

    res.status(200).json({
      status: 200,
      message: "Students fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// GET: Pending fine list
router.get("/fine-pending", async (req, res) => {
  try {
    const issues = await BookIssue.find({
      status: "Returned",
      fineAmount: { $gt: 0 },
    })
      .populate("studentId")
      .populate("bookId", "bookName bookCode")
      .sort({ updatedAt: -1 });

    const payments = await FinePayment.aggregate([
      { $match: { status: true } },
      {
        $group: {
          _id: "$issueId",
          totalPaid: { $sum: "$amountPaid" },
        },
      },
    ]);

    const paymentMap = {};
    payments.forEach((payment) => {
      paymentMap[payment._id.toString()] = payment.totalPaid;
    });

    const data = issues
      .map((item) => {
        const totalFine = Number(item.fineAmount || 0);
        const totalPaid = paymentMap[item._id.toString()] || 0;
        const balance = Math.max(0, totalFine - totalPaid);

        return {
          ...item.toObject(),
          totalFine,
          totalPaid,
          balance,
          paymentStatus:
            balance <= 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Pending",
        };
      })
      .filter((item) => item.balance > 0);

    res.status(200).json({
      status: 200,
      message: "Pending fines fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// POST: Collect fine payment
router.post("/fine-collection", async (req, res) => {
  try {
    const {
      issueId,
      amountPaid,
      paymentDate,
      paymentMode,
      transactionId,
      remarks,
    } = req.body;

    if (!issueId || !amountPaid || !paymentMode) {
      return res.status(400).json({
        status: 400,
        message: "Issue ID, amount and payment mode are required",
      });
    }

    const amount = Number(amountPaid);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        status: 400,
        message: "Enter a valid payment amount",
      });
    }

    const issue = await BookIssue.findById(issueId);

    if (!issue) {
      return res.status(404).json({
        status: 404,
        message: "Book issue record not found",
      });
    }

    if (issue.status !== "Returned") {
      return res.status(400).json({
        status: 400,
        message: "Fine can only be collected after book return",
      });
    }

    const paidResult = await FinePayment.aggregate([
      {
        $match: {
          issueId: issue._id,
          status: true,
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amountPaid" },
        },
      },
    ]);

    const totalPaid = paidResult[0]?.totalPaid || 0;
    const totalFine = Number(issue.fineAmount || 0);
    const balance = Math.max(0, totalFine - totalPaid);

    if (balance <= 0) {
      return res.status(400).json({
        status: 400,
        message: "This fine is already fully paid",
      });
    }

    if (amount > balance) {
      return res.status(400).json({
        status: 400,
        message: `Maximum payable amount is ₹${balance}`,
      });
    }

    const receiptNumber = `FINE-${Date.now()}`;

    const payment = await FinePayment.create({
      receiptNumber,
      issueId: issue._id,
      studentId: issue.studentId,
      bookId: issue.bookId,
      amountPaid: amount,
      paymentDate: paymentDate || new Date(),
      paymentMode,
      transactionId: transactionId || "",
      remarks: remarks || "",
    });

    const newPaid = totalPaid + amount;
    const remainingBalance = Math.max(0, totalFine - newPaid);

    res.status(201).json({
      status: 201,
      message: "Fine payment collected successfully",
      data: payment,
      totalFine,
      totalPaid: newPaid,
      balance: remainingBalance,
      paymentStatus:
        remainingBalance === 0 ? "Paid" : "Partial",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// GET: Fine payment history
router.get("/fine-collections", async (req, res) => {
  try {
    const { studentId, issueId } = req.query;

    const filter = { status: true };

    if (studentId) filter.studentId = studentId;
    if (issueId) filter.issueId = issueId;

    const data = await FinePayment.find(filter)
      .populate("studentId")
      .populate("bookId", "bookName bookCode")
      .populate("issueId", "issueDate dueDate returnDate fineAmount")
      .sort({ paymentDate: -1 });

    res.status(200).json({
      status: 200,
      message: "Fine collection history fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// SEARCH BOOK USING BARCODE / QR CODE
router.get("/book/barcode/:code", async (req, res) => {
  try {
    const code = req.params.code.trim();

    const book = await Book.findOne({
      $or: [
        { bookCode: code },
        { isbn: code }
      ],
      status: true
    }).populate("categoryId", "categoryName");

    if (!book) {
      return res.status(404).json({
        status: 404,
        message: "Book not found"
      });
    }

    res.status(200).json({
      status: 200,
      message: "Book found successfully",
      data: book
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});



module.exports = router;
