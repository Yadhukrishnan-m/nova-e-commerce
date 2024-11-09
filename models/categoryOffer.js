const mongoose=require("mongoose")
const CategotyOffer=mongoose.Schema({
    name:{type:String,
        // required:true
    },
   
    discount:{
       type:Number
      },
   
    category:{
      
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required:true
    },

});

module.exports= mongoose.model('categoryoffer',CategotyOffer); 
