const mongoose= require("mongoose");
const assignSubjectSchema= new mongoose.Schema({
        teacherID: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Teacher",
                required: true
        },
        
        classId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Class",
            require:true

        },
        sectionId:{
             type:mongoose.Schema.Types.ObjectId,
             ref:"Section",
             require:true
        },
        subjectId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Subject",
            require:true
        },
        status:{
            type: Boolean,
    default: true
            
        },
        deletedAt: {
            type: Date,
            default: null
        }
        
},
{
             timestamps: true
}
    )

module.exports=mongoose.model("AssignSubject",assignSubjectSchema)