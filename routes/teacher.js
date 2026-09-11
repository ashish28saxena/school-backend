const express =require("express");
const Teacher=require("../models/Teacher");
const User =require("../models/User");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const Role= require("../models/Role")
const router=express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/teacher");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post(
  "/submit",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  async (req, resp) => {
    try {
      const {
        firstName,
        lastName,
        gender,
        dateOfBirth,
        mobileNumber,
        email,
        employeeID,
        qualification,
        experience,
        joiningDate,
        department,
        employmentType,
        address,
        city,
        state,
        PINCode,
        status,
        password
      } = req.body;

      // Required fields validation
      if (!firstName || !lastName || !email || !password || !dateOfBirth) {
        return resp.status(400).json({
          success: false,
          message: "Please fill all required fields"
        });
      }

      // Find Teacher role
      const role = await Role.findOne({ name: "Teacher" });

      if (!role) {
        return resp.status(404).json({
          success: false,
          message: "Teacher role not found"
        });
      }

      // Convert DD-MM-YYYY to Date
      const [day, month, year] = dateOfBirth.split("/");

      const dob = new Date(`${year}-${month}-${day}`);

      if (isNaN(dob.getTime())) {
        return resp.status(400).json({
          success: false,
          message: "Invalid date of birth"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create User
      const user = new User({
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        gender,
        phoneNumber: mobileNumber,
        roleId: role._id,
        status
      });

      const savedUser = await user.save();

      // Create Teacher
      const teacherdata = new Teacher({
        userId: savedUser._id,
        firstName,
        lastName,
        gender,
        dateOfBirth: dob,
        mobileNumber,
        email,
        employeeID,
        qualification,
        experience,
        joiningDate,
        department,
        employmentType,
        address,
        city,
        state,
        PINCode,
        profileImage:
          req.files?.profileImage?.length > 0
            ? req.files.profileImage[0].filename
            : "",
        status
      });

      await teacherdata.save();

      return resp.status(200).json({
        success: true,
        message: "Teacher added successfully",
        userId: savedUser._id,
        teacherId: teacherdata._id
      });

    } catch (error) {
      console.log("Teacher Submit Error:", error);

      return resp.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error.message
      });
    }
  }
);

router.get("/",async(req,resp)=>{
        //let result= await Teacher.find().populate("userId");
        let result = await Teacher.find()
  .populate({
    path: "userId",
    populate: {
      path: "roleId",
      match: { name: "Teacher" }
    }
  });

        resp.status(200).json({
            success: true,
            data: result
        });
})

router.delete("/delete/:id", async (req, resp) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return resp.status(404).send({
        success: false,
        message: "Teacher not found"
      });
    }

    // User table se delete
    await User.deleteOne({
      _id: teacher.userId
    });

    // Teacher table se delete
    await Teacher.deleteOne({
      _id: req.params.id
    });

    resp.send({
      success: true,
      message: "Teacher and User deleted successfully"
    });

  } catch (error) {
    console.log(error);

    resp.status(500).send({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
});

router.get("/edit/:id", async (req, resp) => {
    try {
        let result = await Teacher.findById(req.params.id)
            .populate({
                path: "userId",
                populate: {
                    path: "roleId",
                    match: { name: "Teacher" }
                }
            });

        if (!result) {
            return resp.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        resp.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.log(error);

        resp.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

module.exports= router;