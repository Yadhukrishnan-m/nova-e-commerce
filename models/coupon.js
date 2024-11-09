const mongoose=require("mongoose")
const couponSchema=mongoose.Schema({
    code:{type:String,
      
    },
    description:{
        type:String,
        // required:true
    },
    discount:{
       type:Number
      },
    minOrder:{
        type:Number,
        
    },
    maxDiscount:{
        type:Number,
        
    },
    expiryDate:{
        type:Date,  
    },
    limitPerUser:{
           type:Number
    }
});

module.exports= mongoose.model('Coupon',couponSchema); 
