const Category=require("../models/category")

const checkDuplicateCategory= async (req,res,next)=>{
    try {
  const    categoryName=   req.body.categoryName;
        const exixtingCategory=await Category.findOne({name:categoryName})

        if (exixtingCategory) {
            req.flash('error','category alredy exists');
            return res.redirect('/admin/category')
        }
    } catch (error) {
        console.log(error);
        
    }
}