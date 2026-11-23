const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // npm i bcryptjs
const multer = require("multer");

const Student = require("../models/Student");
const User = require("../models/User");
const Role = require("../models/Role");       // apne Role model ka path check karo
const Class = require("../models/Class");     // apne paths check karo
const Section = require("../models/Section");
const cloudinary = require("../config/cloudinary");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Multer: files ko local disk par save nahi karna
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and PDF files are allowed"));
    }
  },
});

const studentUploadFields = upload.fields([
  { name: "StudentPhoto", maxCount: 1 },
  { name: "birthCertificate", maxCount: 1 },
  { name: "aadhaarCard", maxCount: 1 },
  { name: "transferCertificate", maxCount: 1 },
  { name: "previousMarksheet", maxCount: 1 },
]);

// Cloudinary upload helper
const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `uploads/${folder}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.on("error", reject);
    stream.end(file.buffer);
  });
};

// Get uploaded file URL or empty string
const uploadField = async (files, fieldName, folder) => {
  if (!files || !files[fieldName] || !files[fieldName][0]) {
    return "";
  }

  const result = await uploadToCloudinary(files[fieldName][0], folder);
  return result.secure_url;
};

router.get("/test-cloudinary", async (req, res) => {
  try {
    const result = await cloudinary.api.ping();

    return res.status(200).json({
      success: true,
      message: "Cloudinary credentials are valid",
      status: result.status,
    });
  } catch (error) {
    console.error("Cloudinary authentication failed:", {
      message: error.message,
      http_code: error.http_code,
    });

    return res.status(500).json({
      success: false,
      message: "Cloudinary authentication failed",
      error: error.message,
    });
  }
});

// ===================== SUBMIT STUDENT (+ AUTO USER) =====================
router.post("/submit", studentUploadFields, async (req, resp) => {
  let createdUser = null; // rollback ke liye

  try {
    const {
      name,
      dataOfBirth,
      gender,
      bloodGroup,
      fatherName,
      motherName,
      fatherOccupation,
      motherOccupation,
      parentMobile,
      admissionNumber,
      className,
      sectionName,
      academicYear,
      previousSchool,
      studentEmail,
      emergencyContact,
      address,
      city,
      state,
      pincode,
      isconfirm,
      password,
    } = req.body;

    // ---- 1. Password validation ----
    if (!password || password.length < 6) {
      return resp.status(400).json({
        success: false,
        message: "Password is required (minimum 6 characters)",
      });
    }

    // ---- 2. Student role dhundo ----
    // NOTE: apne Role model ke field ke hisaab se "roleName" badal lo
    const studentRole = await Role.findOne({
      name: { $regex: /^Student$/i },
    });
    if (!studentRole) {
      return resp.status(500).json({
        success: false,
        message: "Student role not found in Role collection",
      });
    }

    // ---- 3. Duplicate user check (uploads se pehle) ----
    const email = studentEmail?.trim().toLowerCase() || null;
    const mobile = parentMobile?.trim() || null;

    const orConditions = [];
    if (email) orConditions.push({ email });
    if (mobile) orConditions.push({ mobileNumber: mobile });

    if (orConditions.length) {
      const existing = await User.findOne({ $or: orConditions });
      if (existing) {
        return resp.status(409).json({
          success: false,
          message: "A user with this email or mobile number already exists",
        });
      }
    }

    // ---- 4. Files Cloudinary par upload ----
    const files = req.files || {};

    const StudentPhoto = await uploadField(files, "StudentPhoto", "student-photos");
    const birthCertificate = await uploadField(files, "birthCertificate", "student-documents");
    const aadhaarCard = await uploadField(files, "aadhaarCard", "student-documents");
    const transferCertificate = await uploadField(files, "transferCertificate", "student-documents");
    const previousMarksheet = await uploadField(files, "previousMarksheet", "student-documents");

    // ---- 5. User create ----
    const hashedPassword = await bcrypt.hash(password, 10);

    createdUser = await User.create({
      name,
      email,
      mobileNumber: mobile,
      password: hashedPassword,
      role: "student",
      roleId: studentRole._id,
      status: true,
    });

    // ---- 6. Student create (userId ke saath) ----
    const studentData = new Student({
      userId: createdUser._id,
      name,
      dataOfBirth,
      gender,
      StudentPhoto,
      bloodGroup,
      fatherName,
      motherName,
      fatherOccupation,
      motherOccupation,
      parentMobile,
      admissionNumber,
      className,
      sectionName,
      academicYear,
      previousSchool,
      studentEmail,
      emergencyContact,
      address,
      city,
      state,
      pincode,
      isconfirm,
      birthCertificate,
      aadhaarCard,
      transferCertificate,
      previousMarksheet,
    });

    const result = await studentData.save();

    // ---- 7. User me referenceId set karo ----
    createdUser.referenceId = result._id;
    await createdUser.save();

    return resp.status(201).json({
      success: true,
      message: "Student and user created successfully",
      data: result,
    });
  } catch (error) {
    // Student fail hua to user bhi hata do
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id).catch(() => {});
    }

    console.error("Student submission error:", error);

    return resp.status(500).json({
      success: false,
      message: "Student submission failed",
      error: error.message,
    });
  }
});

// ===================== UPDATE STUDENT (+ USER SYNC) =====================
router.put("/update/:id", studentUploadFields, async (req, resp) => {
  try {
    const { id } = req.params;

    // Pehle check karo student exist karta hai ya nahi
    const student = await Student.findById(id);
    if (!student) {
      return resp.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Password validation (optional in edit)
    const newPassword = req.body.password;
    if (newPassword && newPassword.length < 6) {
      return resp.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const files = req.files || {};

    // Text fields: sirf wahi update honge jo req.body me aaye hain
    const textFields = [
      "name",
      "dataOfBirth",
      "gender",
      "bloodGroup",
      "fatherName",
      "motherName",
      "fatherOccupation",
      "motherOccupation",
      "parentMobile",
      "admissionNumber",
      "className",
      "sectionName",
      "academicYear",
      "previousSchool",
      "studentEmail",
      "emergencyContact",
      "address",
      "city",
      "state",
      "pincode",
      "isconfirm",
    ];

    const updateData = {};

    textFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Image fields: sirf tab upload karo jab nayi file mile
    const imageFields = [
      { field: "StudentPhoto", folder: "student-photos" },
      { field: "birthCertificate", folder: "student-documents" },
      { field: "aadhaarCard", folder: "student-documents" },
      { field: "transferCertificate", folder: "student-documents" },
      { field: "previousMarksheet", folder: "student-documents" },
    ];

    for (const { field, folder } of imageFields) {
      if (files[field] && files[field].length > 0) {
        updateData[field] = await uploadField(files, field, folder);
      }
      // else: kuch mat karo, purani image waisi hi rahegi
    }

    // ---- User sync (name, email, mobile, password) ----
    if (student.userId) {
      const userUpdate = {};

      if (req.body.name) userUpdate.name = req.body.name;

      if (req.body.studentEmail !== undefined) {
        userUpdate.email = req.body.studentEmail.trim().toLowerCase() || null;
      }
      if (req.body.parentMobile !== undefined) {
        userUpdate.mobileNumber = req.body.parentMobile.trim() || null;
      }

      // Duplicate check (apne aap ko chhod kar)
      const orConditions = [];
      if (userUpdate.email) orConditions.push({ email: userUpdate.email });
      if (userUpdate.mobileNumber) {
        orConditions.push({ mobileNumber: userUpdate.mobileNumber });
      }
      if (orConditions.length) {
        const duplicate = await User.findOne({
          _id: { $ne: student.userId },
          $or: orConditions,
        });
        if (duplicate) {
          return resp.status(409).json({
            success: false,
            message: "Another user with this email or mobile number already exists",
          });
        }
      }

      if (newPassword) {
        userUpdate.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(userUpdate).length) {
        await User.findByIdAndUpdate(student.userId, { $set: userUpdate });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return resp.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Student update error:", error);

    return resp.status(500).json({
      success: false,
      message: "Student update failed",
      error: error.message,
    });
  }
});

// ===================== GET ALL STUDENTS =====================
router.get("/", async (req, resp) => {
  try {
    let offset = parseInt(req.query.offset) || 0;
    let limit = parseInt(req.query.limit) || 10;

    // Validate pagination values
    offset = Math.max(0, offset);
    limit = Math.max(1, Math.min(100, limit));

    const result = await Student.find()
      .populate("className", "className")
      .populate("sectionName", "sectionName")
      .sort({ _id: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Student.countDocuments();

    return resp.status(200).json({
      success: true,
      total: total,
      offset: offset,
      limit: limit,
      data: result,
    });
  } catch (error) {
    return resp.status(500).json({
      message: "Failed to fetch students",
      error: error.message,
    });
  }
});

// ===================== SEARCH STUDENTS =====================
// NOTE: "/search" ko "/view/:id" waghera se pehle hi rakha hai
router.get("/search", async (req, resp) => {
  try {
    let offset = parseInt(req.query.offset) || 0;
    let limit = parseInt(req.query.limit) || 10;
    offset = Math.max(0, offset);
    limit = Math.max(1, Math.min(100, limit));

    const name = (req.query.name || "").trim();
    const classQ = (req.query.class || "").trim(); // class ka naam ya _id
    const sectionQ = (req.query.section || "").trim(); // section ka naam ya _id

    const filter = {};

    // 1. name diya hai to name se search
    if (name) {
      filter.name = { $regex: escapeRegex(name), $options: "i" };
    }

    // 2. class diya hai to class ki condition
    if (classQ) {
      if (mongoose.Types.ObjectId.isValid(classQ)) {
        filter.className = classQ; // seedha _id aayi
      } else {
        const classes = await Class.find({
          className: { $regex: escapeRegex(classQ), $options: "i" },
        }).select("_id");
        filter.className = { $in: classes.map((c) => c._id) };
      }
    }

    // 3. section diya hai to section ki condition
    if (sectionQ) {
      if (mongoose.Types.ObjectId.isValid(sectionQ)) {
        filter.sectionName = sectionQ;
      } else {
        const sections = await Section.find({
          sectionName: { $regex: escapeRegex(sectionQ), $options: "i" },
        }).select("_id");
        filter.sectionName = { $in: sections.map((s) => s._id) };
      }
    }

    const [result, total] = await Promise.all([
      Student.find(filter)
        .populate("className", "className")
        .populate("sectionName", "sectionName")
        .sort({ _id: -1 })
        .skip(offset)
        .limit(limit),
      Student.countDocuments(filter),
    ]);

    return resp.status(200).json({
      success: true,
      total,
      offset,
      limit,
      data: result,
    });
  } catch (error) {
    return resp.status(500).json({
      message: "Student search failed",
      error: error.message,
    });
  }
});

// ===================== GET STUDENT BY ID =====================
router.get("/view/:id", async (req, resp) => {
  try {
    const result = await Student.findById(req.params.id)
      .populate("className", "className")
      .populate("sectionName", "sectionName");

    if (!result) {
      return resp.status(404).json({
        message: "Student not found",
      });
    }

    return resp.status(200).json(result);
  } catch (error) {
    return resp.status(500).json({
      message: "Failed to fetch student",
      error: error.message,
    });
  }
});

// ===================== DELETE STUDENT (+ USER) =====================
router.delete("/delete/:id", async (req, resp) => {
  try {
    const result = await Student.findByIdAndDelete(req.params.id);

    if (!result) {
      return resp.status(404).json({
        message: "Student not found",
      });
    }

    // Linked user bhi delete karo
    if (result.userId) {
      await User.findByIdAndDelete(result.userId);
    }

    return resp.status(200).json({
      message: "Student deleted successfully",
      data: result,
    });
  } catch (error) {
    return resp.status(500).json({
      message: "Failed to delete student",
      error: error.message,
    });
  }
});

module.exports = router;