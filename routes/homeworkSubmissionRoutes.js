
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Homework = require("../models/Homework");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const authMiddleware = require("../middleware/authMiddleware");


router.use(authMiddleware);

// ADD / SUBMIT HOMEWORK
router.post("/add", async (req, res) => {
  try {
    const { homeworkId, studentId, answer, attachment } = req.body;

    if (!homeworkId || !studentId) {
      return res.status(400).json({
        message: "Homework ID and Student ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(homeworkId) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    if (!answer?.trim() && !attachment?.trim()) {
      return res.status(400).json({
        message: "Please provide an answer or attachment",
      });
    }

    const homework = await Homework.findById(homeworkId);

    if (!homework || !homework.status) {
      return res.status(404).json({
        message: "Homework not found or inactive",
      });
    }

    const existing = await HomeworkSubmission.findOne({
      homeworkId,
      studentId,
    });

    if (existing) {
      return res.status(409).json({
        message: "You have already submitted this homework",
      });
    }

    const isLate = new Date() > new Date(homework.dueDate);

    const submission = await HomeworkSubmission.create({
      homeworkId,
      studentId,
      answer: answer || "",
      attachment: attachment || "",
      status: isLate ? "Late" : "Submitted",
    });

    res.status(201).json({
      success: true,
      message: "Homework submitted successfully",
      data: submission,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Homework already submitted by this student",
      });
    }

    res.status(500).json({ message: error.message });
  }
});

// GET ALL SUBMISSIONS / FILTER BY HOMEWORK OR STUDENT
router.get("/", async (req, res) => {
  try {
    const { homeworkId, studentId, status } = req.query;
    const filter = {};

    if (homeworkId) filter.homeworkId = homeworkId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const submissions = await HomeworkSubmission.find(filter)
      .populate({
        path: "homeworkId",
        populate: [
          { path: "classId", select: "className" },
          { path: "sectionId", select: "sectionName" },
          { path: "subjectId", select: "subjectName" },
        ],
      })
      .populate("studentId")
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SUBMISSION BY ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }

    const submission = await HomeworkSubmission.findById(req.params.id)
      .populate("homeworkId")
      .populate("studentId");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE SUBMISSION ANSWER
router.put("/update/:id", async (req, res) => {
  try {
    const { answer, attachment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }

    const submission = await HomeworkSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (["Checked", "Rejected"].includes(submission.status)) {
      return res.status(400).json({
        message: "This submission can no longer be edited",
      });
    }

    if (answer !== undefined) submission.answer = answer;
    if (attachment !== undefined) submission.attachment = attachment;

    const homework = await Homework.findById(submission.homeworkId);

    submission.status =
      homework && new Date() > new Date(homework.dueDate)
        ? "Late"
        : "Submitted";

    submission.submittedAt = new Date();

    await submission.save();

    res.json({
      success: true,
      message: "Submission updated successfully",
      data: submission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE SUBMISSION
router.delete("/delete/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }

    const submission = await HomeworkSubmission.findByIdAndDelete(
      req.params.id
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




// GET: Submission list with filters
router.get("/evaluation/list", async (req, res) => {
  try {
    const { homeworkId, studentId, status } = req.query;
    const filter = {};

    if (homeworkId) filter.homeworkId = homeworkId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const submissions = await HomeworkSubmission.find(filter)
      .populate({
        path: "homeworkId",
        populate: [
          { path: "classId", select: "className" },
          { path: "sectionId", select: "sectionName" },
          { path: "subjectId", select: "subjectName" },
        ],
      })
      .populate("studentId")
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// PUT: Evaluate submission
router.put("/evaluate/:id", async (req, res) => {
  try {
    const { marksObtained, remarks, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid submission ID",
      });
    }

    const submission = await HomeworkSubmission.findById(
      req.params.id
    ).populate("homeworkId");

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    if (marksObtained !== undefined) {
      const marks = Number(marksObtained);
      const totalMarks = Number(submission.homeworkId?.totalMarks || 0);

      if (!Number.isFinite(marks) || marks < 0 || marks > totalMarks) {
        return res.status(400).json({
          message: `Marks must be between 0 and ${totalMarks}`,
        });
      }

      submission.marksObtained = marks;
    }

    if (remarks !== undefined) {
      submission.remarks = remarks;
    }

    if (status !== undefined) {
      if (!["Checked", "Rejected"].includes(status)) {
        return res.status(400).json({
          message: "Status must be Checked or Rejected",
        });
      }

      submission.status = status;
    } else {
      submission.status = "Checked";
    }

    await submission.save();

    res.json({
      success: true,
      message: "Homework evaluated successfully",
      data: submission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET: Homework Report Summary
router.get("/reports/summary", async (req, res) => {
  try {
    const { homeworkId, status, studentId } = req.query;

    const filter = {};

    if (homeworkId) filter.homeworkId = homeworkId;
    if (studentId) filter.studentId = studentId;

    const submissions = await HomeworkSubmission.find(filter);

    const summary = {
      totalSubmissions: submissions.length,
      submitted: submissions.filter(
        (item) => item.status === "Submitted"
      ).length,
      late: submissions.filter(
        (item) => item.status === "Late"
      ).length,
      checked: submissions.filter(
        (item) => item.status === "Checked"
      ).length,
      rejected: submissions.filter(
        (item) => item.status === "Rejected"
      ).length,
    };

    if (status) {
      summary.filteredCount = submissions.filter(
        (item) => item.status === status
      ).length;
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET: Homework-wise submission report
router.get("/reports/details", async (req, res) => {
  try {
    const { homeworkId, studentId, status } = req.query;

    const filter = {};

    if (homeworkId) filter.homeworkId = homeworkId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const data = await HomeworkSubmission.find(filter)
      .populate({
        path: "homeworkId",
        populate: [
          { path: "classId", select: "className" },
          { path: "sectionId", select: "sectionName" },
          { path: "subjectId", select: "subjectName" },
        ],
      })
      .populate("studentId")
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


module.exports = router;
