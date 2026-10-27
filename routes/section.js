const express=require("express");

const router=express.Router();
const Section = require("../models/Section");
router.get("/",async(req,resp)=>{
          try{
                 let result= await Section.find();
                 resp.send({
                status:200,
                message:"Section fetch Sucessfully",
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
        
           const { sectionName }= req.body;
           const sectionData= new Section({
               sectionName 
           })
           let a= await sectionData.save();
           resp.send({
             status:200,
             message:"Section Crrate Sucessfully",
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

router.put("/update/:id",async(req,resp)=>{
    try{
           const {sectionName}=req.body;
            let result= await Section.findByIdAndUpdate(
            req.params.id,
            {
             sectionName
            }
         )
         resp.send(result)
           resp.send({
             status:200,
             message:"Section Update Sucessfully",
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

router.delete("/delete/:id",async(req,resp)=>{
      try{
             let result= await Section.deleteOne({_id:req.params.id})
             resp.send({
            status:200,
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

router.get("/edit/:id",async(req,resp)=>{
    try{
        let result= await Section.findById({_id:req.params.id})
        resp.send({
            status:200,
            data:result,
            message:"recourd fetch sucessfully"
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