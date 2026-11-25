// const express =require("express");

// const router=express.Router();
// const Role= require("../models/Role")

// router.get("/",async(req,resp)=>{
//     try{
//           const role=  await Role.find();
//           resp.send(role)
//     }catch(error)
//     {
//         console.log(error)
//     }

// })

// router.post("/submit",async(req,resp)=>{
//      const { rolename }= req.body
//      const role= new Role({
//         name:rolename
//      })
//      let a=await role.save();
//      resp.send({
//         message:"Role submit sucessfully",
//         data1:a
//      })
// })

// router.get("/Edit/:id",async(req,resp)=>{
//     try{
//          let result= await Role.findOne({ _id: req.params.id });
//          resp.send(result) 


//     }catch(error)
//     {
//             console.log(error)
//     }
// })

// router.put("/update/:id",async(req,resp)=>{
//     const { rolename }= req.body
//       let result= await Role.findByIdAndUpdate(
//         req.params.id,
//         {
//             name:rolename
//         }
        
//       )
//       resp.send(result) 
// })

// router.delete("/delete/:id",async(req,resp)=>{
//      let result=  await Role.deleteOne({_id:req.params.id})
//       console.log("aaaa")
//      resp.send(result)  
      
// })


// router.get("/search",async(req,resp)=>{
//     const search=req.query.q
//      let result=  await Role.find({
//          $or:[
//                 {name:{$regex:search,$options:"i"}},
                
//             ]

//      })
//      resp.send(result)  
      
// })

// module.exports=router; 



const express = require("express");
const router = express.Router();
const Role = require("../models/Role");

// Add role
router.post("/add", async (req, res) => {
  try {
    const { roleName } = req.body;

    if (!roleName || !roleName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const exists = await Role.findOne({
      roleName: roleName.trim(),
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Role already exists",
      });
    }

    const role = await Role.create({
      name: roleName.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Role added successfully",
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all roles
router.get("/list", async (req, res) => {
  try {
    const data = await Role.find().sort({ _id: -1 });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update role
router.put("/update/:id", async (req, res) => {
  try {
    const data = await Role.findByIdAndUpdate(
      req.params.id,
      { name: req.body.roleName },
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      message: "Role updated successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Change role status
router.patch("/status/:id", async (req, res) => {
  try {
    const data = await Role.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status === true },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;