const express =require("express");

const router=express.Router();
const Role= require("../models/Role")

router.get("/",async(req,resp)=>{
    try{
          const role=  await Role.find();
          resp.send(role)
    }catch(error)
    {
        console.log(error)
    }

})

router.post("/submit",async(req,resp)=>{
     const { rolename }= req.body
     const role= new Role({
        name:rolename
     })
     let a=await role.save();
     resp.send({
        message:"Role submit sucessfully",
        data1:a
     })
})

router.get("/Edit/:id",async(req,resp)=>{
    try{
         let result= await Role.findOne({ _id: req.params.id });
         resp.send(result) 


    }catch(error)
    {
            console.log(error)
    }
})

router.put("/update/:id",async(req,resp)=>{
    const { rolename }= req.body
      let result= await Role.findByIdAndUpdate(
        req.params.id,
        {
            name:rolename
        }
        
      )
      resp.send(result) 
})

router.delete("/delete/:id",async(req,resp)=>{
     let result=  await Role.deleteOne({_id:req.params.id})
      console.log("aaaa")
     resp.send(result)  
      
})


router.get("/search",async(req,resp)=>{
    const search=req.query.q
     let result=  await Role.find({
         $or:[
                {name:{$regex:search,$options:"i"}},
                
            ]

     })
     resp.send(result)  
      
})

module.exports=router; 