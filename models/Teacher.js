const mongoose=require("mongoose");
const TeacherSchema= new mongoose.Schema({

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    firstName:{
        type:String,
        required: true
    },
    
    lastName:{
        type:String,
        required: true
    },

    gender:{
        type:String,
        enum: ["Male", "Female", "Other"],
        required: true
    },

    dateOfBirth:{
        type:Date,
        required: true
    },

    mobileNumber:{
        type:String,
        required: true
    },

    email:{
        type:String,
        required: true
    },

    employeeID:{
        type:String,
        required: true
    },

    qualification:{
        type:String,
        required: true
    },

    experience:{
        type:String,
        required: true
    },

    joiningDate:{
        type:Date,
        required: true
    },

    department:{
        type:String,
        enum: ["Science", "Mathematics", "English","Hindi","Computer","Social Science"],
        required: true
    },

    employmentType:{
        type:String,
        enum: ["Permanent", "Contract", "Part Time"],
        required: true
    },






    address:{
        type:String,
        required: true
    },

    city:{
        type:String,
        required: true
    },

    state:{
        type:String,
        required: true
    },

    PINCode:{
        type:String,
        required: true
    },
    profileImage: {
    type: String,
    default: ""
  },

  status: {
  type: Boolean,
  default: true
}
    
},
{
    timestamps: true
  }

)

module.exports = mongoose.model("Teacher", TeacherSchema);