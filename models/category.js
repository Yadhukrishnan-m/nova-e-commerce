const mongoose=require("mongoose")
const categorySchema=new mongoose.Schema({
    name:{type:String,
       
    },
    description:{
        type:String,
        
    },
  
    is_active:{
        type:Number,
        required:true,
        default:1
    }
},{ collection: 'category' });
;
module.exports= mongoose.model('Category',categorySchema);
