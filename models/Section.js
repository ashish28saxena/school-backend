const mongoose= require("mongoose");
const sectionSchema new mongoose.Schema({
    sectionName:String
})

module.exports=mongoose.model("Section","sectionSchema")