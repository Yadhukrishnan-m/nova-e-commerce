const mongoose=require("mongoose")
const address=new mongoose.Schema({
   
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    street:{
        type:String
    },
    houseName:{
        type:String
    },
    landmark: {
        type:String
    },
    city: {
        type:String
    },
    district: {
        type:String
    },
    state: {
        type:String
    },
    zip: {
        type:String
    },
    addressType: {
        type:String
    },
    mobile: {
        type:String
    },
    altMobile:{
        type:String
    }

  
   
});
;
module.exports= mongoose.model('Address',address);


