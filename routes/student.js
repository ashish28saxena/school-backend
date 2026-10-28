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

// GET ALL STUDENTS
router.get("/", async (req, resp) => {
  try {
    const result = await Student.find().sort({ _id: -1 });
    return resp.status(200).json(result);
  } catch (error) {
    return resp.status(500).json({
      message: "Failed to fetch students",
      error: error.message,
    });
  }
});

// GET STUDENT BY ID
router.get("/view/:id", async (req, resp) => {
  try {
    const result = await Student.findById(req.params.id);

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
    const search = req.query.q || "";

    const result = await Student.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { className: { $regex: search, $options: "i" } },
      ],
    });

    return resp.status(200).json(result);
  } catch (error) {
    return resp.status(500).json({
      message: "Student search failed",
      error: error.message,
    });
  }
});

module.exports = router;