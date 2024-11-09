const express=require('express');
const session=require('express-session')
const flash = require('connect-flash');
const admin_route=express();


admin_route.use(session({
    name:'admin_session',
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if using HTTPS
}));


const path=require("path");

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');


admin_route.use(flash());

// Middleware to pass flash messages to every response
admin_route.use((req, res, next) => {
//   res.locals.msg = req.flash('msg');
res.locals.errorMsg = req.flash('errorMsg');
res.locals.successMsg = req.flash('successMsg');
  next();
});
// requiring multer for file upload
const multer=require('multer')
const productMulter=require('../middleware/productMulter')

const adminController=require('../controllers/admin/userAndOrder');
const coupon=require('../controllers/admin/coupon');
const dashboard=require('../controllers/admin/dashboard');
const category=require("../controllers/admin/category")
const product=require('../controllers/admin/product')
const offer=require('../controllers/admin/offer')
//requiring middlewares for authentication
const adminAuth=require('../middleware/adminAuth') 


// const admin_route = require('./adminRoute');
admin_route.get('/',adminAuth.isLogout,adminController.loadLogin)
admin_route.post('/',adminController.verifyAdmin);
admin_route.get('/users',adminAuth.isLogin,adminController.loadusers);
admin_route.get('/users/:id', adminController.userStatus);

admin_route.get('/category',adminAuth.isLogin,category.loadCategory);
admin_route.post('/category',category.addCategory);
admin_route.post('/category/:id', category.listCategory);
admin_route.get('/category/edit/:id',adminAuth.isLogin,category.loadEditCategory);
admin_route.post('/category/edit/:id',category.editCategory);

// product 
admin_route.get('/product',adminAuth.isLogin,product.loadProduct)

admin_route.get('/product/addProduct',adminAuth.isLogin,product.loadAddProduct)
admin_route.post('/product/addProduct',productMulter.array('image'),product.addProduct);
admin_route.get('/product/edit/:id',adminAuth.isLogin,product.loadEditProduct)
admin_route.post('/product/edit/:id',productMulter.array('image'),product.editProduct)

admin_route.get('/product/:id',product.listProduct)
//to change the order status 

// for admin to logout

admin_route.get('/logout',adminAuth.isLogin,adminController.logout);
admin_route.get('/orders',adminAuth.isLogin,adminController.orders);
admin_route.get('/order/:orderId/:status',adminAuth.isLogin,adminController.changeStatus);
admin_route.get('/productOffer',adminAuth.isLogin,offer.productOfferLoad);
admin_route.get('/productOfferEdit/:id',adminAuth.isLogin,offer.productOfferEditLoad);
admin_route.post('/productOfferEdit/:id',offer.productOfferEdit);
admin_route.get('/productOfferDelete/:id',offer.productOfferDelete);
admin_route.get('/categoryOffer',adminAuth.isLogin,offer.categoryOfferLoad);
admin_route.post('/categoryOffer/add',adminAuth.isLogin,offer.addOffer)
admin_route.get('/categoryOfferEdit/:id',adminAuth.isLogin,offer.categoryOfferEditLoad);
admin_route.post('/categoryOfferEdit/:id',offer.categoryOfferEdit);

admin_route.get('/categoryOffer/delete/:id',adminAuth.isLogin,offer.categoryOfferDelete);
admin_route.get('/coupon',coupon.couponLoad);
admin_route.post('/coupon/addCoupon',coupon.addCoupon);
admin_route.get('/coupon/editCoupon/:id',adminAuth.isLogin,coupon.editCouponLoad);
admin_route.post('/coupon/editCoupon/:id',adminAuth.isLogin,coupon.editCoupon);
admin_route.get('/coupon/deleteCoupon/:id',adminAuth.isLogin, coupon.deleteCoupon);
 
 
admin_route.get('/dashboard',adminAuth.isLogin,dashboard.loadDashboard);
admin_route.get('/dashboard/salesReport/:startDate/:endDate',adminAuth.isLogin,dashboard.loadSalesReport)
admin_route.get('/dashboard/salesReport/downloadPdf/:startDate/:endDate',adminAuth.isLogin,dashboard.downloadPdf)
admin_route.get('/dashboard/salesReport/downloadExcel/:startDate/:endDate',adminAuth.isLogin,dashboard.downloadExcel)
admin_route.get('/dashboard/chart',adminAuth.isLogin,dashboard.chart)
 

admin_route.get('*',function(req,res){
  res.render('404');         //after localhost.../admin whatever the parameter passed it redirect to /admin again
  })


module.exports=admin_route; 