
const express = require("express");
const router = express.Router();

const AssignStudent = require("../models/AssignStudent");
const FeeStructure = require("../models/FeeStructure");
const FeeCollection = require("../models/FeeCollection");
const FeeDiscount = require("../models/FeeDiscount");

router.get("/", async (req, res) => {
  try {
    const { classId, sectionId, academicYear, paymentStatus } = req.query;

    if (!academicYear) {
      return res.status(400).json({
        status: 400,
        message: "Academic year is required",
      });
    }

    const filter = {
      academicYear,
      status: true,
    };

    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;

    const assignments = await AssignStudent.find(filter)
      .populate("studentId")
      .populate("classId")
      .populate("sectionId");

    const report = [];

    for (const assignment of assignments) {
      if (!assignment.studentId) continue;

      const studentId = assignment.studentId._id;
      const assignedClassId = assignment.classId?._id || assignment.classId;
      const assignedSectionId =
        assignment.sectionId?._id || assignment.sectionId || null;

      let structure = null;

      if (assignedSectionId) {
        structure = await FeeStructure.findOne({
          classId: assignedClassId,
          sectionId: assignedSectionId,
          academicYear,
          status: true,
        });
      }

      if (!structure) {
        structure = await FeeStructure.findOne({
          classId: assignedClassId,
          sectionId: null,
          academicYear,
          status: true,
        });
      }

      if (!structure) continue;

      const discount = await FeeDiscount.findOne({
        studentId,
        feeStructureId: structure._id,
        academicYear,
        status: true,
      });

      const payments = await FeeCollection.find({
        studentId,
        feeStructureId: structure._id,
        academicYear,
        status: true,
      });

      const totalFee = Number(structure.totalAmount || 0);
      const discountAmount = Number(discount?.discountAmount || 0);
      const netFee = Math.max(totalFee - discountAmount, 0);

      const paidAmount = payments.reduce(
        (sum, item) => sum + Number(item.amountPaid || 0),
        0
      );

      const balance = Math.max(netFee - paidAmount, 0);
      const advanceAmount = Math.max(paidAmount - netFee, 0);

      const status =
        balance <= 0
          ? "Paid"
          : paidAmount > 0
          ? "Partial"
          : "Unpaid";

      if (paymentStatus && paymentStatus !== status) continue;

      report.push({
        assignmentId: assignment._id,
        student: assignment.studentId,
        class: assignment.classId,
        section: assignment.sectionId,
        rollNumber: assignment.rollNumber || "",
        academicYear,
        feeStructureId: structure._id,
        totalFee,
        discountAmount,
        netFee,
        paidAmount,
        balance,
        advanceAmount,
        paymentStatus: status,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Fee due report fetched successfully",
      summary: {
        totalStudents: report.length,
        totalFee: report.reduce((sum, x) => sum + x.totalFee, 0),
        totalDiscount: report.reduce((sum, x) => sum + x.discountAmount, 0),
        totalPaid: report.reduce((sum, x) => sum + x.paidAmount, 0),
        totalDue: report.reduce((sum, x) => sum + x.balance, 0),
      },
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;
