const mongoose= require("mongoose");

const assignClassSchema= new mongoose.Schema({
    teacherID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true
    },
    classId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Class",
        required:true
    },
    sectionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Section",
        required:true
    },
    academicYear:{
        type:String,
        required:true
    }

}, { timestamps: true }

)

module.exports = mongoose.model("assignClass",assignClassSchema)