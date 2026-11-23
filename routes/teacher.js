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

// router.post(
//   "/submit",
//   upload.fields([{ name: "profileImage", maxCount: 1 }]),
//   async (req, resp) => {
//     try {
//       const {
//         firstName,
//         lastName,
//         gender,
//         dateOfBirth,
//         mobileNumber,
//         email,
//         employeeID,
//         qualification,
//         experience,
//         joiningDate,
//         department,
//         employmentType,
//         address,
//         city,
//         state,
//         PINCode,
//         status,
//         password
//       } = req.body;

//       // Required fields validation
//       if (!firstName || !lastName || !email || !password || !dateOfBirth) {
//         return resp.status(400).json({
//           success: false,
//           message: "Please fill all required fields"
//         });
//       }

//       // Find Teacher role
//       const role = await Role.findOne({ name: "Teacher" });

//       if (!role) {
//         return resp.status(404).json({
//           success: false,
//           message: "Teacher role not found"
//         });
//       }

//       // Convert DD-MM-YYYY to Date
//       const [day, month, year] = dateOfBirth.split("/");

//       const dob = new Date(`${year}-${month}-${day}`);

//       if (isNaN(dob.getTime())) {
//         return resp.status(400).json({
//           success: false,
//           message: "Invalid date of birth"
//         });
//       }

//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // Create User
//       const user = new User({
//         name: `${firstName} ${lastName}`,
//         email,
//         password: hashedPassword,
//         gender,
//         phoneNumber: mobileNumber,
//         roleId: role._id,
//         status
//       });

//       const savedUser = await user.save();

//       // Create Teacher
//       const teacherdata = new Teacher({
//         userId: savedUser._id,
//         firstName,
//         lastName,
//         gender,
//         dateOfBirth: dob,
//         mobileNumber,
//         email,
//         employeeID,
//         qualification,
//         experience,
//         joiningDate,
//         department,
//         employmentType,
//         address,
//         city,
//         state,
//         PINCode,
//         profileImage:
//           req.files?.profileImage?.length > 0
//             ? req.files.profileImage[0].filename
//             : "",
//         status
//       });

//       await teacherdata.save();

//       return resp.status(200).json({
//         success: true,
//         message: "Teacher added successfully",
//         userId: savedUser._id,
//         teacherId: teacherdata._id
//       });

//     } catch (error) {
//       console.log("Teacher Submit Error:", error);

//       return resp.status(500).json({
//         success: false,
//         message: "Something went wrong",
//         error: error.message
//       });
//     }
//   }
// );

const parseDate = (value) => {
  if (!value) return null;

  const parts = String(value).split("T")[0].split(/[\/-]/);
  if (parts.length !== 3) return null;

  let year, month, day;

  if (parts[0].length === 4) {
    // YYYY-MM-DD (frontend date input)
    [year, month, day] = parts;
  } else {
    // DD-MM-YYYY ya DD/MM/YYYY
    [day, month, year] = parts;
  }

  const date = new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  );

  return isNaN(date.getTime()) ? null : date;
};

router.post(
  "/submit",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  async (req, resp) => {
    let savedUser = null;

    try {
      const {
        firstName, lastName, gender, dateOfBirth, mobileNumber, email,
        employeeID, qualification, experience, joiningDate, department,
        employmentType, address, city, state, PINCode, status, password,
      } = req.body;

      if (!firstName || !lastName || !email || !password || !dateOfBirth) {
        return resp.status(400).json({
          success: false,
          message: "Please fill all required fields",
        });
      }

      if (password.length < 6) {
        return resp.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      // Role (case-insensitive)
      const role = await Role.findOne({ name: /^teacher$/i });
      if (!role) {
        return resp.status(404).json({
          success: false,
          message: "Teacher role not found",
        });
      }

      // DOB: DD/MM/YYYY ya DD-MM-YYYY dono chalega
      //const [day, month, year] = dateOfBirth.split(/[\/-]/);
      const dob = parseDate(dateOfBirth);
      if (!dob) {
  return resp.status(400).json({
    success: false,
    message: "Invalid date of birth",
  });
}

      const cleanEmail = email.trim().toLowerCase();
      const cleanMobile = mobileNumber ? mobileNumber.trim() : null;

      // Duplicate check
      const orConditions = [{ email: cleanEmail }];
      if (cleanMobile) orConditions.push({ mobileNumber: cleanMobile });

      const existingUser = await User.findOne({ $or: orConditions });
      if (existingUser) {
        return resp.status(400).json({
          success: false,
          message: "User already exists with this email or mobile number",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // 1) User create (login ke liye)
      savedUser = await User.create({
        name: `${firstName} ${lastName}`,
        email: cleanEmail,
        mobileNumber: cleanMobile,
        password: hashedPassword,
        role: "teacher",
        roleId: role._id,
        status: status !== undefined ? status : true,
      });

      // 2) Teacher create
      const teacherdata = await Teacher.create({
        userId: savedUser._id,
        firstName,
        lastName,
        gender,
        dateOfBirth: dob,
        mobileNumber: cleanMobile,
        email: cleanEmail,
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
        profileImage: req.files?.profileImage?.[0]?.filename || "",
        status,
      });

      // 3) User me teacher ka reference save
      savedUser.referenceId = teacherdata._id;
      await savedUser.save();

      return resp.status(200).json({
        success: true,
        message: "Teacher added successfully",
        userId: savedUser._id,
        teacherId: teacherdata._id,
      });
    } catch (error) {
      console.log("Teacher Submit Error:", error);

      // Teacher fail ho to user rollback
      if (savedUser) await User.findByIdAndDelete(savedUser._id);

      return resp.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error.message,
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



router.put(
  "/update/:id",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  async (req, resp) => {
    let userId = null;
    let oldUserData = null;

    try {
      const { id } = req.params;

      const {
        firstName, lastName, gender, dateOfBirth, mobileNumber, email,
        employeeID, qualification, experience, joiningDate, department,
        employmentType, address, city, state, PINCode, status, password,
      } = req.body;

      const teacherdata = await Teacher.findById(id);
      if (!teacherdata) {
        return resp.status(404).json({ success: false, message: "Teacher not found" });
      }

      const user = await User.findById(teacherdata.userId).select("+password");
      if (!user) {
        return resp.status(404).json({ success: false, message: "User not found" });
      }

      if (password && password.length < 6) {
        return resp.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      const cleanEmail = email ? email.trim().toLowerCase() : undefined;
      const cleanMobile = mobileNumber ? mobileNumber.trim() : undefined;

      // Duplicate check (apne user ko chhod kar)
      const orConditions = [];
      if (cleanEmail) orConditions.push({ email: cleanEmail });
      if (cleanMobile) orConditions.push({ mobileNumber: cleanMobile });

      if (orConditions.length) {
        const duplicateUser = await User.findOne({
          $or: orConditions,
          _id: { $ne: user._id },
        });
        if (duplicateUser) {
          return resp.status(400).json({
            success: false,
            message: "Another user already exists with this email or mobile number",
          });
        }
      }

      // DOB
      if (dateOfBirth !== undefined && dateOfBirth !== "") {
        const dob = parseDate(dateOfBirth);
        if (!dob) {
          return resp.status(400).json({ success: false, message: "Invalid date of birth" });
        }
        teacherdata.dateOfBirth = dob;
      }

      // Teacher fields
      if (firstName !== undefined) teacherdata.firstName = firstName;
      if (lastName !== undefined) teacherdata.lastName = lastName;
      if (gender !== undefined) teacherdata.gender = gender;
      if (cleanMobile !== undefined) teacherdata.mobileNumber = cleanMobile;
      if (cleanEmail !== undefined) teacherdata.email = cleanEmail;
      if (employeeID !== undefined) teacherdata.employeeID = employeeID;
      if (qualification !== undefined) teacherdata.qualification = qualification;
      if (experience !== undefined) teacherdata.experience = experience;
      if (joiningDate !== undefined && joiningDate !== "") teacherdata.joiningDate = joiningDate;
      if (department !== undefined) teacherdata.department = department;
      if (employmentType !== undefined) teacherdata.employmentType = employmentType;
      if (address !== undefined) teacherdata.address = address;
      if (city !== undefined) teacherdata.city = city;
      if (state !== undefined) teacherdata.state = state;
      if (PINCode !== undefined) teacherdata.PINCode = PINCode;
      if (status !== undefined) teacherdata.status = status;

      // Nayi image aaye to purani delete karo
      const oldImage = teacherdata.profileImage;
      if (req.files?.profileImage?.length > 0) {
        teacherdata.profileImage = req.files.profileImage[0].filename;
        if (oldImage) {
          fs.unlink(path.join("uploads/teacher", oldImage), () => {});
        }
      }

      // User fields (rollback ke liye purana data)
      userId = user._id;
      oldUserData = {
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        status: user.status,
        password: user.password,
      };

      user.name = `${teacherdata.firstName} ${teacherdata.lastName}`;
      if (cleanEmail !== undefined) user.email = cleanEmail;
      if (cleanMobile !== undefined) user.mobileNumber = cleanMobile;
      if (status !== undefined) user.status = status;
      if (password) user.password = await bcrypt.hash(password, 10);
      if (!user.referenceId) user.referenceId = teacherdata._id;

      await user.save();
      await teacherdata.save();

      return resp.status(200).json({
        success: true,
        message: "Teacher updated successfully",
        data: teacherdata,
      });
    } catch (error) {
      console.log("Teacher Update Error:", error);

      // Teacher save fail ho to user ko purani state me wapas
      if (userId && oldUserData) {
        await User.findByIdAndUpdate(userId, oldUserData).catch(() => {});
      }

      return resp.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
    }
  }
);
module.exports= router;