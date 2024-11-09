const mongoose=require('mongoose');
const wishlist=new mongoose.Schema({
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
    size:{
        type:String
    }
})
module.exports=mongoose.model('Wishlist',wishlist);