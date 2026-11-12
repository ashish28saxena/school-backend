
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Teacher = require("../models/Teacher");
const teacherAttendance = require("../models/TeacherAttendance");

// Convert YYYY-MM-DD into normalized UTC date
const normalizeDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

const allowedStatus = [
  "Present",
  "Absent",
  "Leave",
  "Half Day",
  "Late"
];

// 1. Get all teachers with selected date attendance
router.get("/date/:date", async (req, res) => {
  try {
    const attendanceDate = normalizeDate(req.params.date);

    if (!attendanceDate) {
      return res.status(400).json({
        status: 400,
        message: "Invalid attendance date"
      });
    }

    const [teachers, attendance] = await Promise.all([
      Teacher.find().lean(),
      teacherAttendance.find({ attendanceDate }).lean()
    ]);

    const attendanceMap = new Map(
      attendance.map(item => [
        item.teacherId.toString(),
        item
      ])
    );

    const result = teachers.map(teacher => {
      const record = attendanceMap.get(teacher._id.toString());

      return {
        teacherId: teacher._id,
        teacher,
        attendanceId: record?._id || null,
        status: record?.status || "",
        checkIn: record?.checkIn || "",
        checkOut: record?.checkOut || "",
        remarks: record?.remarks || ""
      };
    });

    res.status(200).json({
      status: 200,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});


// 2. Bulk save attendance

router.post("/bulk", async (req, res) => {
  try {
    const { attendanceDate, attendance } = req.body;

    const normalizedDate = normalizeDate(attendanceDate);

    if (!normalizedDate) {
      return res.status(400).json({
        status: 400,
        message: "Invalid attendance date"
      });
    }

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Attendance records are required"
      });
    }

    const seen = new Set();

    // Validate attendance records
    for (const item of attendance) {

      // Use teacherID instead of teacherId
      if (!mongoose.Types.ObjectId.isValid(item.teacherID)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid teacher ID",
          teacherID: item.teacherID
        });
      }

      if (seen.has(item.teacherID.toString())) {
        return res.status(400).json({
          status: 400,
          message: "Duplicate teacher in attendance request"
        });
      }

      seen.add(item.teacherID.toString());

      if (!allowedStatus.includes(item.status)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid attendance status"
        });
      }
    }

    const teacherIds = [...seen];

    const validTeachers = await Teacher.countDocuments({
      _id: { $in: teacherIds }
    });

    if (validTeachers !== teacherIds.length) {
      return res.status(400).json({
        status: 400,
        message: "One or more teachers do not exist"
      });
    }

    // Bulk insert/update
    const operations = attendance.map(item => ({
      updateOne: {
        filter: {
          teacherId: item.teacherID,
          attendanceDate: normalizedDate
        },
        update: {
          $set: {
            status: item.status,
            checkIn: item.checkIn || "",
            checkOut: item.checkOut || "",
            remarks: item.remark || ""
          }
        },
        upsert: true
      }
    }));

    await teacherAttendance.bulkWrite(operations, {
      ordered: true
    });

    res.status(200).json({
      status: 200,
      message: "Teacher attendance saved successfully"
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});



// 3. Attendance dashboard summary
router.get("/summary", async (req, res) => {
  try {
    const dateValue =
      req.query.date || new Date().toISOString().slice(0, 10);

    const attendanceDate = normalizeDate(dateValue);

    if (!attendanceDate) {
      return res.status(400).json({
        status: 400,
        message: "Invalid date"
      });
    }

    const [totalTeachers, records] = await Promise.all([
      Teacher.countDocuments(),
      teacherAttendance.find({ attendanceDate }).lean()
    ]);

    const summary = {
      totalTeachers,
      marked: records.length,
      pending: totalTeachers - records.length,
      present: records.filter(x => x.status === "Present").length,
      absent: records.filter(x => x.status === "Absent").length,
      leave: records.filter(x => x.status === "Leave").length,
      halfDay: records.filter(x => x.status === "Half Day").length,
      late: records.filter(x => x.status === "Late").length
    };

    res.status(200).json({
      status: 200,
      data: summary
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});


// 4. Individual teacher monthly report
router.get("/report/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const month = req.query.month;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid teacher ID"
      });
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
      return res.status(400).json({
        status: 400,
        message: "Month must be YYYY-MM"
      });
    }

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      1
    );

    const records = await teacherAttendance.find({
      teacherId,
      attendanceDate: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ attendanceDate: 1 });

    res.status(200).json({
      status: 200,
      data: records
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});


// 5. Update individual attendance
router.patch("/update/:id", async (req, res) => {
  try {
    const { status, checkIn, checkOut, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid attendance ID"
      });
    }

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid attendance status"
      });
    }

    const result = await teacherAttendance.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          checkIn: checkIn || "",
          checkOut: checkOut || "",
          remarks: remarks || ""
        }
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      status: 200,
      message: "Attendance updated successfully",
      data: result
    });

  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
});

module.exports = router;
