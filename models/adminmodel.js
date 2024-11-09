const mongoose=require("mongoose")
const adminSchema=new mongoose.Schema({
    name:{type:String,
       
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
       
    },
    password:{
        type:String,
        required :true
    },
    is_admin:{
        type:Number,
        required:true
    }
},{ collection: 'Admin' });
;
module.exports= mongoose.model('Admin',adminSchema);
