
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const TeacherSalary = require("../models/TeacherSalary");
const Teacher = require("../models/Teacher");

// ADD SALARY
router.post("/submit", async (req, res) => {
  try {
    const {
      teacherId,
      basicSalary,
      hra,
      medicalAllowance,
      transportAllowance,
      otherAllowance,
      pf,
      professionalTax,
      effectiveFrom,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid teacher ID",
      });
    }

    const teacherExists = await Teacher.findById(teacherId);

    if (!teacherExists) {
      return res.status(404).json({
        status: 404,
        message: "Teacher not found",
      });
    }

    const salary = await TeacherSalary.create({
      teacherId,
      basicSalary,
      hra,
      medicalAllowance,
      transportAllowance,
      otherAllowance,
      pf,
      professionalTax,
      effectiveFrom,
    });

    return res.status(201).json({
      status: 201,
      message: "Teacher salary added successfully",
      data: salary,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// GET ALL SALARY
router.get("/get", async (req, res) => {
  try {
    const data = await TeacherSalary.find()
      .populate("teacherId")
      .sort({ _id: -1 });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// GET SINGLE SALARY
router.get("/get/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid salary ID",
      });
    }

    const data = await TeacherSalary.findById(req.params.id)
      .populate("teacherId");

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Salary record not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// UPDATE SALARY
router.put("/update/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid salary ID",
      });
    }

    const allowedFields = [
      "teacherId",
      "basicSalary",
      "hra",
      "medicalAllowance",
      "transportAllowance",
      "otherAllowance",
      "pf",
      "professionalTax",
      "effectiveFrom",
      "status",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.teacherId) {
      if (!mongoose.Types.ObjectId.isValid(updateData.teacherId)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid teacher ID",
        });
      }

      const teacherExists = await Teacher.findById(updateData.teacherId);

      if (!teacherExists) {
        return res.status(404).json({
          status: 404,
          message: "Teacher not found",
        });
      }
    }

    const data = await TeacherSalary.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("teacherId");

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Salary record not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Salary updated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


// DELETE SALARY
router.delete("/delete/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid salary ID",
      });
    }

    const data = await TeacherSalary.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Salary record not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Salary deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;
