const express= require("express");
const router=express.Router();
const Student=require("../models/Student");
const multer = require("multer");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/submit",upload.fields([
    { name: "StudentPhoto", maxCount: 1 },
    { name: "birthCertificate", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "transferCertificate", maxCount: 1 },
    { name: "previousMarksheet", maxCount: 1 }
  ]),async(req,resp)=>{
     const { name,dataOfBirth,gender,StudentPhoto,bloodGroup,fatherName,motherName,fatherOccupation,motherOccupation,parentMobile,admissionNumber,className,academicYear,previousSchool,studentEmail,emergencyContact,address,city,state,pincode,isconfirm,birthCertificate,aadhaarCard,transferCertificate,previousMarksheet }= req.body
     const studentData=new Student({
          name,
          dataOfBirth,
          gender,
          StudentPhoto:req.files.StudentPhoto? req.files.StudentPhoto[0].filename: "",
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
          birthCertificate:req.files.birthCertificate? req.files.birthCertificate[0].filename: "",
          aadhaarCard:req.files.aadhaarCard? req.files.aadhaarCard[0].filename: "",
          transferCertificate:req.files.transferCertificate? req.files.transferCertificate[0].filename: "",
          previousMarksheet:req.files.previousMarksheet? req.files.previousMarksheet[0].filename: "",

     })

     let result= await studentData.save();
     resp.send({
        message:"Student submit sucessfully",
        data1:result
     })
})


router.get("/",async(req,resp)=>{
    let result= await Student.find();
    resp.send(result) 
})

router.get("/view/:id",async(req,resp)=>{
    let id=req.params.id;
    let result= await Student.findById({_id:id})
    resp.send(result) 
})

router.delete("/delete/:id",async(req,resp)=>{
    const id= req.params.id
    let result= await Student.deleteOne({_id:id})
    resp.send(result) 
})

router.get("/search",async(req,resp)=>{
    const search=req.query.q
     let result=  await Student.find({
         $or:[
                {name:{$regex:search,$options:"i"}},
                {className:{$regex:search,$options:"i"}},
                
            ]

     })
     resp.send(result)  
      
})


module.exports=router;