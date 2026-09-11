const express= require("express");
const Subject= require("../models/Subject");
const router= express.Router();
router.get("/",async(req,resp)=>{
      try{
            const Subjectdata = await Subject.find()
                        .populate("classId")

            resp.status(200).json({
            success: true,
            data: Subjectdata
        });
      }catch(error)
      {
          console.log(error)
      }
})

router.post("/submit",async(req,resp)=>{
      try{
            const { name,code,classId,subjectType,status}=req.body;
            const subjectdata= new Subject({
                name,
                code,
                classId,
                subjectType,
                status
            })
            await subjectdata.save();
            resp.status(200).json({
            success: true,
            message: "Subject Add sucessfully",

        });
      }catch(error)
      {
          console.log(error)
      }
})

router.put("/update/:id",async(req,resp)=>{
    try{
        const { name,code,classId,subjectType,status}=req.body;
        const subjectdata= await Subject.findByIdAndUpdate(
        req.params.id,
        {
            name,
                code,
                classId,
                subjectType,
                status
        }
    )
    resp.status(200).json({
            success: true,
            message: "Update Subject sucessfully",

        });

    }catch(error)
    {
      console.log(error)
    }
})


router.get("/edit/:id",async(req,resp)=>{
    try{
        let result= await Subject.findOne({_id:req.params.id})
        resp.send(result)
    }catch(error)
    {
        console.log(error)
    }
})

router.delete("/delete/:id",async(req,resp)=>{
    try{
        let result = await Subject.deleteOne({_id:req.params.id})
        resp.send(result)
    }catch(error)
    {
        console.log(error)
    }
})

module.exports = router;