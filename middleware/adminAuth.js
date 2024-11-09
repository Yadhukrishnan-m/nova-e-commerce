const isLogin= async (req,res,next)=>{   //if session is not exixst then login is compalsery
    try {
        if (!req.session.admin_id) {
            return res.redirect('/admin/')  
        } 
        next();
    } catch (error) {
        console.log(error.message);
        
    }
}

const isLogout= async (req,res,next)=>{ //if alredy session is exist then only show home 
    try {
        if (req.session.admin_id) {
             return res.redirect('/admin/dashboard'); 
        }    
        next();
    } catch (error) {
        console.log(error.message); 
        
    }
}



module.exports={
    isLogin,
    isLogout
}