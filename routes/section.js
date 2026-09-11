const express=require("express");

const router=express.Router();
const Section=require("../modules/Section")
router.get("/",(req,resp)=>{
           let result=Section.find  
})

module.exports=router;