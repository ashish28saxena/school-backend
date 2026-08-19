const mongoose=require("mongoose");

const classSchema= new mongoose.Schema({
       className:String,
       classSection:String
})

module.exports= mongoose.model("Class",classSchema)