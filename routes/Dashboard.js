
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Parent = require("../models/Parent");
const Class = require("../models/Class");

// AUTH MIDDLEWARE
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: 401,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: "Invalid or expired token",
    });
  }
};

// ROLE CHECK
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 403,
        message: "Access denied",
      });
    }

    next();
  };
};

// ADMIN DASHBOARD
router.get(
  "/admin",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const [
        totalStudents,
        totalTeachers,
        totalParents,
        totalClasses,
        classDistribution,
        academicYearAdmissions,
      ] = await Promise.all([
        Student.countDocuments(),

        Teacher.countDocuments({ status: true }),

        Parent.countDocuments({ status: true }),

        Class.countDocuments(),

        Student.aggregate([
          {
            $group: {
              _id: "$className",
              total: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "classes",
              localField: "_id",
              foreignField: "_id",
              as: "classData",
            },
          },
          {
            $unwind: {
              path: "$classData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              name: {
                $ifNull: ["$classData.className", "Unassigned"],
              },
              value: "$total",
            },
          },
        ]),

        Student.aggregate([
          {
            $group: {
              _id: "$academicYear",
              total: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              month: { $ifNull: ["$_id", "Unknown"] },
              students: "$total",
            },
          },
        ]),
      ]);

      res.status(200).json({
        status: 200,
        message: "Admin dashboard data fetched",
        data: {
          stats: [
            {
              title: "Total Students",
              value: totalStudents,
            },
            {
              title: "Total Teachers",
              value: totalTeachers,
            },
            {
              title: "Total Parents",
              value: totalParents,
            },
            {
              title: "Total Classes",
              value: totalClasses,
            },
          ],

          monthlyTitle: "Academic Year Admissions",
          monthlyKeys: ["students"],
          monthlyData: academicYearAdmissions,

          distributionTitle: "Class-wise Students",
          distribution: classDistribution,

          attendance: [],
          feeData: [],
          marksData: [],
          recent: [],
        },
      });
    } catch (error) {
      console.error("Admin Dashboard Error:", error);

      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  }
);

// TEACHER DASHBOARD
router.get(
  "/teacher",
  verifyToken,
  allowRoles("teacher"),
  async (req, res) => {
    try {
      const teacherId = req.user.referenceId;

      const teacher = await Teacher.findById(teacherId);

      if (!teacher) {
        return res.status(404).json({
          status: 404,
          message: "Teacher not found",
        });
      }

      res.status(200).json({
        status: 200,
        message: "Teacher dashboard data fetched",
        data: {
          stats: [
            {
              title: "Teacher Name",
              value: `${teacher.firstName} ${teacher.lastName}`,
            },
            {
              title: "Employee ID",
              value: teacher.employeeID,
            },
            {
              title: "Department",
              value: teacher.department,
            },
            {
              title: "Experience",
              value: teacher.experience,
            },
          ],
          monthlyData: [],
          monthlyKeys: [],
          attendance: [],
          distribution: [],
          feeData: [],
          marksData: [],
          recent: [],
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  }
);

// STUDENT DASHBOARD
router.get(
  "/student",
  verifyToken,
  allowRoles("student"),
  async (req, res) => {
    try {
      const studentId = req.user.referenceId;

      const student = await Student.findById(studentId)
        .populate("className")
        .populate("sectionName");

      if (!student) {
        return res.status(404).json({
          status: 404,
          message: "Student not found",
        });
      }

      res.status(200).json({
        status: 200,
        message: "Student dashboard data fetched",
        data: {
          stats: [
            {
              title: "Student Name",
              value: student.name,
            },
            {
              title: "Admission Number",
              value: student.admissionNumber || "-",
            },
            {
              title: "Academic Year",
              value: student.academicYear || "-",
            },
            {
              title: "Class",
              value: student.className?.className || "-",
            },
          ],
          monthlyData: [],
          monthlyKeys: [],
          attendance: [],
          distribution: [],
          feeData: [],
          marksData: [],
          recent: [],
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  }
);

// PARENT DASHBOARD
router.get(
  "/parent",
  verifyToken,
  allowRoles("parent"),
  async (req, res) => {
    try {
      const parentId = req.user.referenceId;

      const parent = await Parent.findById(parentId)
        .populate("studentIds");

      if (!parent) {
        return res.status(404).json({
          status: 404,
          message: "Parent not found",
        });
      }

      const children = parent.studentIds || [];

      res.status(200).json({
        status: 200,
        message: "Parent dashboard data fetched",
        data: {
          stats: [
            {
              title: "Parent Name",
              value: parent.parentName,
            },
            {
              title: "Linked Children",
              value: children.length,
            },
            {
              title: "Mobile Number",
              value: parent.mobileNumber,
            },
            {
              title: "Relation",
              value: parent.relation,
            },
          ],
          monthlyData: [],
          monthlyKeys: [],
          attendance: [],
          distribution: [],
          feeData: [],
          marksData: [],
          recent: children.map((student) => ({
            name: student.name,
            admissionNumber: student.admissionNumber,
            academicYear: student.academicYear,
          })),
          recentTitle: "My Children",
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  }
);

module.exports = router;
