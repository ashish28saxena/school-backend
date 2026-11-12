const mongoose=require("mongoose");

const classSchema= new mongoose.Schema({
       className:String,
       
})

module.exports= mongoose.model("Class",classSchema)