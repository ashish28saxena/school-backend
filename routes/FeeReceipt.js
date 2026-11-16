
const express = require("express");
const router = express.Router();
const FeeCollection = require("../models/FeeCollection");

// GET all receipts
router.get("/", async (req, res) => {
  try {
    const filter = { status: true };

    if (req.query.receiptNumber) {
      filter.receiptNumber = {
        $regex: req.query.receiptNumber,
        $options: "i",
      };
    }

    const result = await FeeCollection.find(filter)
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .populate("feeStructureId")
      .sort({ paymentDate: -1 });

    res.status(200).json({
      status: 200,
      message: "Receipts fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// GET receipt by receipt number
router.get("/:receiptNumber", async (req, res) => {
  try {
    const result = await FeeCollection.findOne({
      receiptNumber: req.params.receiptNumber,
      status: true,
    })
      .populate("studentId")
      .populate("classId")
      .populate("sectionId")
      .populate("feeStructureId");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Receipt not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Receipt fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

module.exports = router;
