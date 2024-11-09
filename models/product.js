const mongoose=require("mongoose")
const productSchema=mongoose.Schema({
    name:{type:String,
        // required:true
    },
    description:{
        type:String,
        // required:true
    },
    image:[{
        type:String,
       
    }],
    mrp:{
        type:Number,
        
    },
    discount:{
       type:Number
      },
    offerPrice:{
        type:Number,
      
    },
    stockS:{
        type:Number,
        
    },
    stockM:{
        type:Number,
        
    },
    stockL:{
        type:Number,
        
    },
    stockXL:{
        type:Number,
        
    }, stockXXL:{
        type:Number,
        
    }, 
    category:{
      
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required:true
    },
    specification:{
        type:String
    },
    is_active:{
        type:Number,
        required:true,
        default:1
    },
    offerIsActive:{
        type:Number,
     
    }

});

module.exports= mongoose.model('Product',productSchema); 
