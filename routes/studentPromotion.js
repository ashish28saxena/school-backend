const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const AssignStudent = require("../models/AssignStudent");
const StudentPromotion = require("../models/StudentPromotion");
const Class = require("../models/Class");
const Section = require("../models/Section");

const { verifyToken, allowRoles } = require("../middleware/auth");

// GET STUDENTS FROM ASSIGN STUDENT + JOIN STUDENT
router.get(
  "/students",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { classId, sectionId, academicYear } = req.query;

      if (!classId || !academicYear) {
        return res.status(400).json({
          success: false,
          message: "Class and academic year are required",
        });
      }

      if (!mongoose.isValidObjectId(classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class ID",
        });
      }

      if (sectionId && !mongoose.isValidObjectId(sectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid section ID",
        });
      }

      const filter = {
        classId: new mongoose.Types.ObjectId(classId),
        academicYear,
        status: true,
      };

      if (sectionId) {
        filter.sectionId = new mongoose.Types.ObjectId(sectionId);
      }

      const students = await AssignStudent.aggregate([
        { $match: filter },

        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },

        {
          $lookup: {
            from: Class.collection.name,
            localField: "classId",
            foreignField: "_id",
            as: "class",
          },
        },
        { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: Section.collection.name,
            localField: "sectionId",
            foreignField: "_id",
            as: "section",
          },
        },
        { $unwind: { path: "$section", preserveNullAndEmptyArrays: true } },

        {
          $project: {
            studentId: 1,
            classId: 1,
            sectionId: 1,
            rollNumber: 1,
            academicYear: 1,
            status: 1,
            student: {
              _id: "$student._id",
              name: "$student.name",
              admissionNumber: "$student.admissionNumber",
              StudentPhoto: "$student.StudentPhoto",
            },
            class: {
              _id: "$class._id",
              className: "$class.className",
            },
            section: {
              _id: "$section._id",
              sectionName: "$section.sectionName",
            },
          },
        },

        { $sort: { rollNumber: 1 } },
      ]);

      return res.status(200).json({
        success: true,
        count: students.length,
        data: students,
      });
    } catch (error) {
      console.error("Fetch Promotion Students Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// BULK PROMOTION
router.post(
  "/promote",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const {
        studentIds,
        fromClass,
        fromSection,
        toClass,
        toSection,
        fromAcademicYear,
        toAcademicYear,
        promotionStatus,
        remarks,
      } = req.body;

      if (
        !Array.isArray(studentIds) ||
        studentIds.length === 0 ||
        !fromClass ||
        !fromSection ||
        !toClass ||
        !toSection ||
        !fromAcademicYear ||
        !toAcademicYear
      ) {
        return res.status(400).json({
          success: false,
          message: "All promotion details are required",
        });
      }

      if (fromAcademicYear === toAcademicYear) {
        return res.status(400).json({
          success: false,
          message: "Academic years must be different",
        });
      }

      if (!["Promoted", "Detained"].includes(promotionStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid promotion status",
        });
      }

      const ids = [...new Set(studentIds.map(String))];

      if (
        ids.length !== studentIds.length ||
        ids.some((id) => !mongoose.isValidObjectId(id))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or duplicate student IDs",
        });
      }

      const sourceClass = await Class.findById(fromClass);
      const destinationClass = await Class.findById(toClass);
      const sourceSection = await Section.findById(fromSection);
      const destinationSection = await Section.findById(toSection);

      if (
        !sourceClass ||
        !destinationClass ||
        !sourceSection ||
        !destinationSection
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid class or section",
        });
      }

      // Find active source enrollment records
      const sourceEnrollments = await AssignStudent.find({
        studentId: { $in: ids },
        classId: fromClass,
        sectionId: fromSection,
        academicYear: fromAcademicYear,
        status: true,
      });

      if (sourceEnrollments.length !== ids.length) {
        return res.status(400).json({
          success: false,
          message: "Some students do not have active source enrollment",
        });
      }

      // Prevent duplicate destination enrollment
      const existingEnrollments = await AssignStudent.find({
        studentId: { $in: ids },
        academicYear: toAcademicYear,
        status: true,
      }).select("studentId");

      if (existingEnrollments.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Some students are already enrolled in destination year",
          students: existingEnrollments.map((item) => item.studentId),
        });
      }

      // Find the last roll number in destination class + section + year
      const lastEnrollment = await AssignStudent.findOne({
        classId: toClass,
        sectionId: toSection,
        academicYear: toAcademicYear,
        status: true,
      }).sort({ rollNumber: -1 });

      let nextRollNumber = lastEnrollment
        ? lastEnrollment.rollNumber + 1
        : 1;

      const newEnrollments = sourceEnrollments.map((enrollment) => ({
        studentId: enrollment.studentId,
        classId: toClass,
        sectionId: toSection,
        rollNumber: nextRollNumber++,
        academicYear: toAcademicYear,
        status: true,
      }));

      const historyRecords = sourceEnrollments.map((enrollment) => ({
        studentId: enrollment.studentId,
        fromClass,
        fromSection,
        toClass,
        toSection,
        fromAcademicYear,
        toAcademicYear,
        promotionStatus,
        remarks: remarks || "",
        promotedBy: req.user?.userId,
      }));

      /*
       * Transaction-free sequence for deployments that don't support
       * transactions. If a later step fails, inspect the records before
       * retrying the request.
       */

      // 1. Create destination enrollment records
      await AssignStudent.insertMany(newEnrollments);

      try {
        // 2. Create promotion history
        await StudentPromotion.insertMany(historyRecords);
      } catch (historyError) {
        // Roll back newly created destination enrollments
        await AssignStudent.deleteMany({
          studentId: { $in: ids },
          classId: toClass,
          sectionId: toSection,
          academicYear: toAcademicYear,
        });

        throw historyError;
      }

      try {
        // 3. Deactivate old enrollment records
        await AssignStudent.updateMany(
          {
            _id: { $in: sourceEnrollments.map((item) => item._id) },
            status: true,
          },
          {
            $set: { status: false },
          }
        );
      } catch (updateError) {
        // Remove history and destination enrollments if source update fails
        await StudentPromotion.deleteMany({
          studentId: { $in: ids },
          toAcademicYear,
        });

        await AssignStudent.deleteMany({
          studentId: { $in: ids },
          classId: toClass,
          sectionId: toSection,
          academicYear: toAcademicYear,
        });

        throw updateError;
      }

      return res.status(201).json({
        success: true,
        message: `${ids.length} students enrolled in ${toAcademicYear} successfully`,
      });
    } catch (error) {
      console.error("Student Promotion Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ALL PROMOTION HISTORY
router.get(
  "/history",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const history = await StudentPromotion.find()
        .populate("studentId", "name admissionNumber StudentPhoto")
        .populate("fromClass", "className")
        .populate("fromSection", "sectionName")
        .populate("toClass", "className")
        .populate("toSection", "sectionName")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// INDIVIDUAL STUDENT HISTORY
router.get(
  "/history/:studentId",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const history = await StudentPromotion.find({
        studentId: req.params.studentId,
      })
        .populate("studentId", "name admissionNumber")
        .populate("fromClass", "className")
        .populate("fromSection", "sectionName")
        .populate("toClass", "className")
        .populate("toSection", "sectionName")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;