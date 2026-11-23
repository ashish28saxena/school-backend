const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Parent = require("../models/Parent");
const Student = require("../models/Student");
const User = require("../models/User");
const Role = require("../models/Role");

// Student model me class ka field name yahan set karo
const CLASS_FIELD = "classId";

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
    res.status(500).json({ status: 500, message: error.message });
  }
});

// GET: Students list (class filter ke saath)
// /parents/students/list?classId=xxxx
// NOTE: ye "/:id" se pehle rakha hai taaki conflict na ho
router.get("/students/list", async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = {};

    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ status: 400, message: "Invalid class ID" });
      }
      filter[CLASS_FIELD] = classId;
    }

    const result = await Student.find(filter).sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Students fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// GET: Parent by ID (edit form ke liye)
// selectedClassIds -> frontend me class dropdown pre-select karne ke liye
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 400, message: "Invalid parent ID" });
    }

    const result = await Parent.findById(req.params.id).populate("studentIds");

    if (!result || !result.status) {
      return res.status(404).json({ status: 404, message: "Parent not found" });
    }

    const data = result.toObject();

    // Is parent ke students ki unique classes
    data.selectedClassIds = [
      ...new Set(
        (data.studentIds || [])
          .map((s) => s && s[CLASS_FIELD] && String(s[CLASS_FIELD]))
          .filter(Boolean)
      ),
    ];

    // Un classes ke saare students, taaki edit me list + selected dono dikhein
    data.classStudents = data.selectedClassIds.length
      ? await Student.find({ [CLASS_FIELD]: { $in: data.selectedClassIds } }).sort({ _id: -1 })
      : [];

    res.status(200).json({
      status: 200,
      message: "Parent fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

// POST: Add parent
router.post("/submit", async (req, res) => {
  let createdUser = null;

  try {
    const {
      parentName, relation, mobileNumber, alternateMobileNumber,
      email, occupation, address, studentIds, password,
    } = req.body;

    if (!parentName || !relation || !mobileNumber) {
      return res.status(400).json({
        status: 400,
        message: "Parent name, relation and mobile number are required",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 400,
        message: "Password must be at least 6 characters",
      });
    }

    const ids = [...new Set(studentIds || [])];

    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ status: 400, message: "Invalid student ID" });
    }

    if (ids.length) {
      const count = await Student.countDocuments({ _id: { $in: ids } });
      if (count !== ids.length) {
        return res.status(400).json({
          status: 400,
          message: "One or more students were not found",
        });
      }
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanMobile = mobileNumber.trim();

    const orConditions = [{ mobileNumber: cleanMobile }];
    if (cleanEmail) orConditions.push({ email: cleanEmail });

    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        message: "User already exists with this mobile number or email",
      });
    }

    const role = await Role.findOne({ name: /^parent$/i });
    if (!role) {
      return res.status(400).json({
        status: 400,
        message: "Parent role not found in Role collection",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    createdUser = await User.create({
      name: parentName,
      email: cleanEmail,
      mobileNumber: cleanMobile,
      password: hashedPassword,
      role: "parent",
      roleId: role._id,
    });

    const parent = await Parent.create({
      userId: createdUser._id,
      parentName,
      relation,
      mobileNumber: cleanMobile,
      alternateMobileNumber,
      email: cleanEmail || "",
      occupation,
      address,
      studentIds: ids,
    });

    createdUser.referenceId = parent._id;
    await createdUser.save();

    res.status(201).json({
      status: 201,
      message: "Parent added successfully",
      data: parent,
    });
  } catch (error) {
    if (createdUser) await User.findByIdAndDelete(createdUser._id);

    res.status(500).json({ status: 500, message: error.message });
  }
});

// PUT: Update parent (linked User bhi update hoga)
router.put("/update/:id", async (req, res) => {
  let oldUserData = null;
  let userId = null;

  try {
    const {
      parentName, relation, mobileNumber, alternateMobileNumber,
      email, occupation, address, studentIds,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 400, message: "Invalid parent ID" });
    }

    if (!parentName || !relation || !mobileNumber) {
      return res.status(400).json({
        status: 400,
        message: "Parent name, relation and mobile number are required",
      });
    }

   

    const ids = [...new Set(studentIds || [])];

    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ status: 400, message: "Invalid student ID" });
    }

    if (ids.length) {
      const count = await Student.countDocuments({ _id: { $in: ids } });
      if (count !== ids.length) {
        return res.status(400).json({
          status: 400,
          message: "One or more students were not found",
        });
      }
    }

    const existingParent = await Parent.findOne({ _id: req.params.id, status: true });
    if (!existingParent) {
      return res.status(404).json({ status: 404, message: "Parent not found" });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanMobile = mobileNumber.trim();

    // Linked user dhundo (userId ya referenceId se)
    const linkedUser = existingParent.userId
      ? await User.findById(existingParent.userId)
      : await User.findOne({ referenceId: existingParent._id });

    // Duplicate check (apne user ko chhod kar)
    const orConditions = [{ mobileNumber: cleanMobile }];
    if (cleanEmail) orConditions.push({ email: cleanEmail });

    const duplicateQuery = { $or: orConditions };
    if (linkedUser) duplicateQuery._id = { $ne: linkedUser._id };

    const duplicateUser = await User.findOne(duplicateQuery);
    if (duplicateUser) {
      return res.status(400).json({
        status: 400,
        message: "Another user already exists with this mobile number or email",
      });
    }

    // User update (rollback ke liye purana data save)
    if (linkedUser) {
      userId = linkedUser._id;
      oldUserData = {
        name: linkedUser.name,
        email: linkedUser.email,
        mobileNumber: linkedUser.mobileNumber,
        
      };

      linkedUser.name = parentName;
      linkedUser.email = cleanEmail;
      linkedUser.mobileNumber = cleanMobile;
      
      await linkedUser.save();
    }

    const result = await Parent.findOneAndUpdate(
      { _id: req.params.id, status: true },
      {
        parentName,
        relation,
        mobileNumber: cleanMobile,
        alternateMobileNumber,
        email: cleanEmail || "",
        occupation,
        address,
        studentIds: ids,
        ...(linkedUser && { userId: linkedUser._id }),
      },
      { new: true, runValidators: true }
    ).populate("studentIds");

    if (!result) {
      throw new Error("Parent not found");
    }

    res.status(200).json({
      status: 200,
      message: "Parent updated successfully",
      data: result,
    });
  } catch (error) {
    // Parent update fail ho to user ko purani state me wapas
    if (userId && oldUserData) {
      await User.findByIdAndUpdate(userId, oldUserData).catch(() => {});
    }

    res.status(500).json({ status: 500, message: error.message });
  }
});

// DELETE: Soft delete parent (linked User bhi deactivate)
// DELETE: Permanent delete parent (linked User bhi delete)
router.delete("/delete/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ status: 400, message: "Invalid parent ID" });
    }

    const result = await Parent.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ status: 404, message: "Parent not found" });
    }

    // Linked user bhi permanently delete
    if (result.userId) {
      await User.findByIdAndDelete(result.userId);
    } else {
      await User.findOneAndDelete({ referenceId: result._id });
    }

    res.status(200).json({
      status: 200,
      message: "Parent deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
});

module.exports = router;