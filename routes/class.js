const express = require("express");

const router=express.Router();
const Class=require("../models/Class");

router.get("/",async(req,resp)=>{
          try{
            const classlist= await Class.find();
            resp.send(classlist)

          }catch(error)
          {
            console.log(error)
          }
})


router.post("/submit",async(req,resp)=>{
    try{
          const { className,classSection }= req.body;
          const classdats= new Class({
            className:className,
            classSection:classSection
          })
          let a=await classdats.save();
          resp.send({
        message:"Class submit sucessfully",
        data1:a
     })
    }catch(error)
    {
          console.log(error);
    }

})


router.delete("/delete/:id",async(req,resp)=>{
         let result= await Class.deleteOne({_id:req.params.id})
         resp.send(result)
})

router.put("/update/:id",async(req,resp)=>{
         const { className,classSection }= req.body;
         let result= await Class.findByIdAndUpdate(
            req.params.id,
            {
             className:className,
             classSection:classSection
            }
         )
         resp.send(result)
})

router.get("/edit/:id",async(req,resp)=>{
         let result= await Class.findOne({_id:req.params.id})
         resp.send(result)
})

module.exports=router; 