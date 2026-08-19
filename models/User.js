const mongoose=require("mongoose");
const UserSchema= new mongoose.Schema({
    name:String,
    email:{
            type:String,
            required:true,
            unique:true
    },
    password:{
        type:String,
        required:true
    },
    gender:String,
    phoneNumber:String,
    status:String,
    roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true
  }
    
});

module.exports=mongoose.model("User",UserSchema); 