const express = require("express");
const Attendence = require("../models/Attendence");
const router = express.Router();

router.post("/submit", async(req, resp) => {
    try {
        const { classId, teacherId, attendenceDate, studentAttendence } = req.body;
        const attendencest = new Attendence({
            classId,
            teacherId,
            attendenceDate,
            studentAttendence

        })
        await attendencest.save();
        resp.status(200).json({
            success: true,
            message: "Attendence Mark sucessfully",

        });
    } catch (error) {
        console.log(error);
    }
})

router.get("/list",async(req,resp)=>{
      try {
        

        const attendance = await Attendence.find()
            .populate("classId")
            .populate("teacherId")
            .populate("studentAttendence.studentId");

        resp.status(200).json({
            success: true,
            data: attendance
        });

    } catch (error) {
        console.log(error);

        resp.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
})





router.get("/get/:classId/:attendenceDate", async (req, res) => {
    try {

        const classId = req.params.classId;
        const attendenceDate = req.params.attendenceDate;

        

        const attendance = await Attendence.find({
            classId,
            attendenceDate
        })
        .populate({
            path: "classId",
            select: "className classSection"
        })
        .populate({
            path: "teacherId",
            select: "name"
        })
        .populate({
            path: "studentAttendence.studentId",
            select: "name"
        });

        res.status(200).json({
            success: true,
            data: attendance
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



module.exports = router;