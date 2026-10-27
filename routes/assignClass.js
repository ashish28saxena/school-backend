const express= require("express");
const assignClass=require("../models/AssignClass");
const router=express.Router();

router.get("/",async(req,resp)=>{
      try{
               let result= await assignClass.find();
               resp.send({
            status:200,
            message:"Data fetch Sucessfully",
            data:result
           })
      }catch(error)
      {
           resp.send({
            status:500,
            message:error
           })
      }
})


router.post("/submit",async(req,resp)=>{
     try{
        const { teacherID,classId,sectionId,academicYear}=req.body;
        let result= new assignClass({
                teacherID,
                classId,
                sectionId,
                academicYear
        })
         let a= await result.save();
        resp.send({
            status:200,
            message:"Assign Class Sucessfully",
            data:a
         })

     }catch(error)
     {
         resp.send({
            status:500,
            message:error
         })
     }
})

module.exports=router;