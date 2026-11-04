// const express= require("express");
// const router=express.Router();
// const Student=require("../models/Student");
// const multer = require("multer");
// const cloudinary = require("../config/cloudinary");

// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, "uploads/");
// //   },

// //   filename: (req, file, cb) => {
// //     cb(null, Date.now() + "-" + file.originalname);
// //   }
// // });
// const storage = multer.memoryStorage();
// // const upload = multer({ storage });

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // Maximum 5 MB per file
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       "image/jpeg",
//       "image/png",
//       "image/jpg",
//       "application/pdf",
//     ];

//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error("Only JPG, PNG and PDF files are allowed")
//       );
//     }
//   },
// });

// // Cloudinary upload helper
// const uploadToCloudinary = (file, folder) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: `school-management/${folder}`,
//         resource_type: "auto",
//       },
//       (error, result) => {
//         if (error) {
//           return reject(error);
//         }

//         resolve(result);
//       }
//     );

//     stream.end(file.buffer);
//   });
// };

// // Get uploaded file URL or empty string
// const uploadField = async (files, fieldName, folder) => {
//   if (!files || !files[fieldName] || !files[fieldName][0]) {
//     return "";
//   }

//   const result = await uploadToCloudinary(
//     files[fieldName][0],
//     folder
//   );

//   return result.secure_url;
// };

// router.post("/submit",upload.fields([
//     { name: "StudentPhoto", maxCount: 1 },
//     { name: "birthCertificate", maxCount: 1 },
//     { name: "aadhaarCard", maxCount: 1 },
//     { name: "transferCertificate", maxCount: 1 },
//     { name: "previousMarksheet", maxCount: 1 }
//   ]),async(req,resp)=>{
//      const { name,dataOfBirth,gender,StudentPhoto,bloodGroup,fatherName,motherName,fatherOccupation,motherOccupation,parentMobile,admissionNumber,className,academicYear,previousSchool,studentEmail,emergencyContact,address,city,state,pincode,isconfirm,birthCertificate,aadhaarCard,transferCertificate,previousMarksheet }= req.body
//      const studentData=new Student({
//           name,
//           dataOfBirth,
//           gender,
//           StudentPhoto:req.files.StudentPhoto? req.files.StudentPhoto[0].filename: "",
//           bloodGroup,
//           fatherName,
//           motherName,
//           fatherOccupation,
//           motherOccupation,
//           parentMobile,
//           admissionNumber,
//           className,
//           academicYear,
//           previousSchool,
//           studentEmail,
//           emergencyContact,
//           address,
//           city,
//           state,
//           pincode,
//           isconfirm,
//           birthCertificate:req.files.birthCertificate? req.files.birthCertificate[0].filename: "",
//           aadhaarCard:req.files.aadhaarCard? req.files.aadhaarCard[0].filename: "",
//           transferCertificate:req.files.transferCertificate? req.files.transferCertificate[0].filename: "",
//           previousMarksheet:req.files.previousMarksheet? req.files.previousMarksheet[0].filename: "",

//      })

//      let result= await studentData.save();
//      resp.send({
//         message:"Student submit sucessfully",
//         data1:result
//      })
// })


// router.get("/",async(req,resp)=>{
//     let result= await Student.find();
//     resp.send(result) 
// })

// router.get("/view/:id",async(req,resp)=>{
//     let id=req.params.id;
//     let result= await Student.findById({_id:id})
//     resp.send(result) 
// })

// router.delete("/delete/:id",async(req,resp)=>{
//     const id= req.params.id
//     let result= await Student.deleteOne({_id:id})
//     resp.send(result) 
// })

// router.get("/search",async(req,resp)=>{
//     const search=req.query.q
//      let result=  await Student.find({
//          $or:[
//                 {name:{$regex:search,$options:"i"}},
//                 {className:{$regex:search,$options:"i"}},
                
//             ]

//      })
//      resp.send(result)  
      
// })


// module.exports=router;


const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

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
      cb(
        new Error("Only JPG, PNG and PDF files are allowed")
      );
    }
  },
});

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

  const result = await uploadToCloudinary(
    files[fieldName][0],
    folder
  );

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

// SUBMIT STUDENT
router.post(
  "/submit",
  upload.fields([
    { name: "StudentPhoto", maxCount: 1 },
    { name: "birthCertificate", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "transferCertificate", maxCount: 1 },
    { name: "previousMarksheet", maxCount: 1 },
  ]),
  async (req, resp) => {
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
      } = req.body;

      const files = req.files || {};

      // Upload files to Cloudinary
      const StudentPhoto = await uploadField(
        files,
        "StudentPhoto",
        "student-photos"
      );

      const birthCertificate = await uploadField(
        files,
        "birthCertificate",
        "student-documents"
      );

      const aadhaarCard = await uploadField(
        files,
        "aadhaarCard",
        "student-documents"
      );

      const transferCertificate = await uploadField(
        files,
        "transferCertificate",
        "student-documents"
      );

      const previousMarksheet = await uploadField(
        files,
        "previousMarksheet",
        "student-documents"
      );

      // Save student details and uploaded file URLs in MongoDB
      const studentData = new Student({
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

      return resp.status(201).json({
        success: true,
        message: "Student submitted successfully",
        data: result,
      });
    } catch (error) {
      console.error("Student submission error:", error);

      return resp.status(500).json({
        success: false,
        message: "Student submission failed",
        error: error.message,
      });
    }
  }
);

router.put(
  "/update/:id",
  upload.fields([
    { name: "StudentPhoto", maxCount: 1 },
    { name: "birthCertificate", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "transferCertificate", maxCount: 1 },
    { name: "previousMarksheet", maxCount: 1 },
  ]),
  async (req, resp) => {
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
  }
);

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
      data: result
    });

  } catch (error) {
    return resp.status(500).json({
      message: "Failed to fetch students",
      error: error.message
    });
  }
});


// GET STUDENT BY ID
router.get("/view/:id", async (req, resp) => {
  try {
    const result = await Student.findById(req.params.id)
          .populate("className", "className")   
          .populate("sectionName", "sectionName")  
          
    

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

// DELETE STUDENT
router.delete("/delete/:id", async (req, resp) => {
  try {
    const result = await Student.findByIdAndDelete(req.params.id);

    if (!result) {
      return resp.status(404).json({
        message: "Student not found",
      });
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

// SEARCH STUDENTS
router.get("/search", async (req, resp) => {
  try {
    let offset = parseInt(req.query.offset) || 0;
    let limit = parseInt(req.query.limit) || 10;
    offset = Math.max(0, offset);
    limit = Math.max(1, Math.min(100, limit));

    const name = (req.query.name || "").trim();
    const classQ = (req.query.class || "").trim();     // class ka naam ya _id
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

module.exports = router;