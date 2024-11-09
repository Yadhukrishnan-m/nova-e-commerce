const mongoose=require('mongoose');
const reviewSchema=mongoose.Schema({
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
    description:{
        type :String
    },
    date:{
        type:Date
    }
})
module.exports= mongoose.model('Review',reviewSchema); 
