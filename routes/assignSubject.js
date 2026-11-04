const express = require("express");
const mongoose = require("mongoose"); // FIX: ye import missing tha
const assignSubject = require("../models/AssignSubject");
const router = express.Router();

const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Section = require("../models/Section");
const Subject = require("../models/Subject");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.post("/submit", async (req, resp) => {
  try {
    const { teacherID, classId, sectionId, subjectId, status } = req.body;
    let result = new assignSubject({
      teacherID,
      classId,
      sectionId,
      subjectId,
      status,
    });
    await result.save();
    resp.send({
      status: 200,
      message: "Assign Subject Sucessfully",
    });
  } catch (error) {
    resp.send({
      status: 500,
      message: error.message,
    });
  }
});

router.get("/filter-options", async (req, resp) => {
  try {
    const [classIds, sectionIds, subjectIds] = await Promise.all([
      assignSubject.distinct("classId"),
      assignSubject.distinct("sectionId"),
      assignSubject.distinct("subjectId"),
    ]);

    const [classes, sections, subjects] = await Promise.all([
      Class.find({ _id: { $in: classIds } }).sort({ className: 1 }),
      Section.find({ _id: { $in: sectionIds } }).sort({ sectionName: 1 }),
      Subject.find({ _id: { $in: subjectIds } }).sort({ name: 1 }),
    ]);

    return resp.status(200).json({
      success: true,
      classes,
      sections,
      subjects,
    });
  } catch (error) {
    return resp.status(500).json({ success: false, message: error.message });
  }
});

router.get("/", async (req, resp) => {
  try {
    let offset = parseInt(req.query.offset) || 0;
    let limit = parseInt(req.query.limit) || 10;

    offset = Math.max(0, offset);
    limit = Math.max(1, Math.min(100, limit));

    const { search, classId, sectionId, subjectId, status } = req.query;
    const filter = {};

    // Class / Section / Subject (valid ObjectId ho tabhi lagao)
    if (classId && mongoose.isValidObjectId(classId)) filter.classId = classId;
    if (sectionId && mongoose.isValidObjectId(sectionId))
      filter.sectionId = sectionId;
    if (subjectId && mongoose.isValidObjectId(subjectId))
      filter.subjectId = subjectId;

    // Status: "true" / "false"
    if (status === "true") filter.status = true;
    if (status === "false") filter.status = false;

    // Teacher search: pehle naam se teacher dhoondo, phir unki IDs se filter
    if (search && search.trim()) {
      const words = search.trim().split(/\s+/).map(escapeRegex);

      // Har word firstName ya lastName me milna chahiye ("ram sharma" bhi chalega)
      const teachers = await Teacher.find({
        $and: words.map((w) => ({
          $or: [
            { firstName: { $regex: w, $options: "i" } },
            { lastName: { $regex: w, $options: "i" } },
          ],
        })),
      }).select("_id");

      filter.teacherID = { $in: teachers.map((t) => t._id) };
    }

    const [result, total] = await Promise.all([
      assignSubject
        .find(filter)
        .populate("teacherID")
        .populate("classId")
        .populate("sectionId")
        .populate("subjectId")
        .sort({ _id: -1 })
        .skip(offset)
        .limit(limit),
      assignSubject.countDocuments(filter), // filter ke hisaab se total
    ]);

    return resp.status(200).json({
      success: true,
      total,
      offset,
      limit,
      data: result,
      status: 200,
      message: "data fetch Sucessfully",
    });
  } catch (error) {
    return resp.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
});

router.get("/edit/:id", async (req, resp) => {
  try {
    let result = await assignSubject.findById(req.params.id);
    resp.send({
      status: 200,
      data: result,
      message: "data fetch Sucessfully",
    });
  } catch (error) {
    resp.send({
      status: 500,
      message: error.message,
    });
  }
});

router.put("/update/:id", async (req, resp) => {
  try {
    const { teacherID, classId, sectionId, subjectId, status } = req.body;
    let result = await assignSubject.findByIdAndUpdate(req.params.id, {
      teacherID,
      classId,
      sectionId,
      subjectId,
      status,
    });
    resp.send({
      status: 200,
      message: "data Update Sucessfully",
      data: result,
    });
  } catch (error) {
    resp.send({
      status: 500,
      message: error.message,
    });
  }
});

router.delete("/delete/:id", async (req, resp) => {
  try {
    const result = await assignSubject.findByIdAndDelete(req.params.id);

    if (!result) {
      return resp.status(404).json({
        status: 404,
        message: "Assign Subject not found",
      });
    }

    return resp.status(200).json({
      status: 200,
      message: "Assign Subject deleted successfully",
      data: result,
    });
  } catch (error) {
    console.log("Delete Error:", error);

    return resp.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = router;