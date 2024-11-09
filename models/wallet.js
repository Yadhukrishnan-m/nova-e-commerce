const mongoose=require('mongoose');
const walletSchema=mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    balance:{
        type :Number,
        
    },
    transaction:[{
       amount:{type:Number},
       date:{type:Date},
       transactionMode:{type:String}
    }]
})
module.exports= mongoose.model('Wallet',walletSchema); 
