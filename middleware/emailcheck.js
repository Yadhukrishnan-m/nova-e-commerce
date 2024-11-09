const User=require("../models/usermodel")

const checkDuplicateEmail = async (req, res, next) => {
    try {
         const email = req.body.email;
        const existingUser = await User.findOne({ email: email });
        
        if (existingUser) {
         req.flash('error', 'email alredy existed');
         return   res.redirect('/register');
        }
        
        next(); 

    } catch (error) {
        console.log(error.message);
       
    }
};

module.exports ={
    checkDuplicateEmail,
   
   
}
