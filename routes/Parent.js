
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Parent = require("../models/Parent");
const Student = require("../models/Student");

// GET: All parents
router.get("/", async (req, res) => {
  try {
    const result = await Parent.find({ status: true })
      .populate("studentIds")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Parents fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET: Parent by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid parent ID",
      });
    }

    const result = await Parent.findById(req.params.id)
      .populate("studentIds");

    if (!result || !result.status) {
      return res.status(404).json({
        status: 404,
        message: "Parent not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Parent fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// POST: Add parent
router.post("/submit", async (req, res) => {
  try {
    const {
      parentName,
      relation,
      mobileNumber,
      alternateMobileNumber,
      email,
      occupation,
      address,
      studentIds,
    } = req.body;

    if (!parentName || !relation || !mobileNumber) {
      return res.status(400).json({
        status: 400,
        message: "Parent name, relation and mobile number are required",
      });
    }

    const ids = [...new Set(studentIds || [])];

    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        status: 400,
        message: "Invalid student ID",
      });
    }

    if (ids.length) {
      const count = await Student.countDocuments({
        _id: { $in: ids },
      });

      if (count !== ids.length) {
        return res.status(400).json({
          status: 400,
          message: "One or more students were not found",
        });
      }
    }

    const parent = await Parent.create({
      parentName,
      relation,
      mobileNumber,
      alternateMobileNumber,
      email,
      occupation,
      address,
      studentIds: ids,
    });

    res.status(201).json({
      status: 201,
      message: "Parent added successfully",
      data: parent,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// PUT: Update parent
router.put("/update/:id", async (req, res) => {
  try {
    const {
      parentName,
      relation,
      mobileNumber,
      alternateMobileNumber,
      email,
      occupation,
      address,
      studentIds,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid parent ID",
      });
    }

    if (!parentName || !relation || !mobileNumber) {
      return res.status(400).json({
        status: 400,
        message: "Parent name, relation and mobile number are required",
      });
    }

    const ids = [...new Set(studentIds || [])];

    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        status: 400,
        message: "Invalid student ID",
      });
    }

    if (ids.length) {
      const count = await Student.countDocuments({
        _id: { $in: ids },
      });

      if (count !== ids.length) {
        return res.status(400).json({
          status: 400,
          message: "One or more students were not found",
        });
      }
    }

    const result = await Parent.findOneAndUpdate(
      { _id: req.params.id, status: true },
      {
        parentName,
        relation,
        mobileNumber,
        alternateMobileNumber,
        email,
        occupation,
        address,
        studentIds: ids,
      },
      { new: true, runValidators: true }
    ).populate("studentIds");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Parent not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Parent updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// DELETE: Soft delete parent
router.delete("/delete/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid parent ID",
      });
    }

    const result = await Parent.findOneAndUpdate(
      { _id: req.params.id, status: true },
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Parent not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Parent deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET: Active students for parent mapping
router.get("/students/list", async (req, res) => {
  try {
    const result = await Student.find()
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Students fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;
