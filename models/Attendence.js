const mongoose=require("mongoose");
const attendenceSchema= new mongoose.Schema({
    
     classId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Class",
         required: true
       },
       teacherId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true
       },
     
     attendenceDate: {
      type: Date,
      required: true,
    },
    studentAttendence: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },

        student_mark: { 
          type: String,
          enum: ["Present", "Absent", "Late"],
          required: true,
        },
      },
    ],
})

module.exports=mongoose.model("Attendence",attendenceSchema);


