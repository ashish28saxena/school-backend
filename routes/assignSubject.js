const express= require("express");
const assignSubject=require("../models/AssignSubject");
const router=express.Router();

 router.post("/submit",async(req,resp)=>{
               try{
                       const {teacherID,classId,sectionId,subjectId,status} = req.body;
                       let result= new assignSubject({
                         teacherID,
                         classId,
                         sectionId,
                         subjectId,
                         status
                       })
                       let a=await result.save();
                       resp.send({
                        status:200,
                        message:"Assign Subject Sucessfully"
                })
               }catch(error)
               {
                resp.send({
                    status:500,
                    message:error
                })
               }
 })

 router.get("/",async(req,resp)=>{
    try{
       let result= await assignSubject.find();
       resp.send({
            status:200,
            data:result,
            message:"data fetch Sucessfully"
        })
    }catch(error)
    {
        resp.send({
            status:500,
            message:error
        })
    }
 })

  router.get("/edit/:id",async(req,resp)=>{
    try{
       let result= await assignSubject.findById({_id:req.params.id});
       resp.send({
            status:200,
            data:result,
            message:"data fetch Sucessfully"
        })
    }catch(error)
    {
        resp.send({
            status:500,
            message:error
        })
    }
 })

 router.put("/update/:id",async(req,resp)=>{
    try{
          const {teacherID,classId,sectionId,subjectId,status} = req.body;
         let result= await assignSubject.findByIdAndUpdate(
            req.params.id,
            {
                         teacherID,
                         classId,
                         sectionId,
                         subjectId,
                         status 
            }
         )
         resp.send({
        status:200,
        message:"data Update Sucessfully",
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

 router.delete("/delete/:id",async(req,resp)=>{
    try{
         let result= await assignSubject.delete({_id:req.params.id})
         resp.send({
            status:200,
            message:result
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