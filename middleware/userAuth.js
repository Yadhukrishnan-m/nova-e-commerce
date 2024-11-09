const User=require('../models/usermodel');

const isLogin= async (req,res,next)=>{  
    try {
        if (!req.session.user_id) {
            req.flash('error','please login ')
            return res.redirect('/login')  
        } 
        const user =await User.findById(req.session.user_id);
        if (!user.is_active) {
           
            req.session.destroy(err => { 
                res.redirect('/login');  
            });
            
        } else {
            // Continue if user is not blocked
            next();
        }
    } catch (error) {
        console.log(error.message);
        
    }
}



// const isLogout= async (req,res,next)=>{ //if alredy session is exist then only show home 
//     try {
//         if (req.session.user_id) {
//              return res.redirect('/admin/dashboard'); 
//         }    
//         next();
//     } catch (error) {
//         console.log(error.message);
        
//     }
// }



module.exports={
    isLogin,
    // isLogout,
    // isBlocked
}