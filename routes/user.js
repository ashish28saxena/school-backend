const express = require("express")
const User =require("../models/User");
const bcrypt = require("bcryptjs");
const router= express.Router();

router.post("/userSubmit", async(req,resp)=>{
    try{
        const {name,email,password,gender,phoneNumber,roleId,status} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user= new User({
            name,
            email,
            password:hashedPassword,
            gender,
            phoneNumber,
            roleId,
            status
        })

        await user.save();
        resp.send({
            success: true,
            message: "User Submit Sucessfully",
            
        });

    } catch(error)
    {
        console.log(error)
    }
       
})

router.put("/userSubmit/:id",async(req,resp)=>{
    try{
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body
        );

        if (!user)
        {
                return resp.send({ message: "User not found" });
        }
        resp.send(user)
            

    res.json(user);


    }catch(error)
    {

    }
       
})

router.get("/userList", async(req,resp)=>{
   // const user= await User.find(); 
   const users = await User.find().populate("roleId");

    resp.send(users)

})

router.delete("/userDelete/:id",async(req,resp)=>{
       const user= await User.deleteOne({_id:req.params.id});
       resp.send(user)
})

router.get("/userEdit/:id",async(req,resp)=>{
       const user= await User.findById(req.params.id)
       resp.send(user)
})

router.get("/userSearch",async(req,resp)=>{
        const search=req.query.q
        const user= await User.find({
            $or:[
                {name:{$regex:search,$options:"i"}},
                {email:{$regex:search,$options:"i"}}
            ]
        })

        resp.send({data:user})
})

module.exports = router;