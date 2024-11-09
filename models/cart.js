const mongoose=require("mongoose")
const cart=new mongoose.Schema({
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required:true
       
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
  
    count:{
        type:Number,
        
        default:1
    },
   size:{
    type:String

    },

});
;
module.exports= mongoose.model('Cart',cart);
