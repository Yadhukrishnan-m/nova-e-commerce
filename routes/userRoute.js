const express=require('express');
const user_route=express();
const session=require('express-session')


user_route.use('/',session({
    secret: 'your_secret_key',  
    resave: false,             
    saveUninitialized: true,   
    cookie: { secure: false }
}));


const path=require("path");

user_route.set('view engine','ejs');
user_route.set('views','./views/user');
//user_route.set('views', path.join(__dirname, 'views/user'));
const flash = require('connect-flash');
user_route.use(flash());

// Middleware to pass flash messages to every response
user_route.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

//  for sending email otp
const crypto = require("crypto");
//for google sifn in passport -
const passport=require('passport');
require("../config/passport")
require('../config/passportFacebook')

user_route.use(passport.initialize());
user_route.use(passport.session());

// requiring admin auth
// const userAuth=require('../middleware/userAuth') 

// requireing middleware
const mailcheck=require('../middleware/emailcheck')
const userAuth=require('../middleware/userAuth')

const homeAndOrder=require('../controllers/user/homeAndOrder');
const coupon=require('../controllers/user/coupon');
const payment=require('../controllers/user/payment');
const wallet=require('../controllers/user/wallet');
const googleLogin=require('../controllers/user/googleLogin')
const facebookLogin=require('../controllers/user/facebookLogin')
const accessControl=require('../controllers/user/accessControl')
const accounts=require('../controllers/user/accounts')
const wishlist=require('../controllers/user/wishlist')
const cart=require('../controllers/user/cart')
user_route.get('/',homeAndOrder.home);

user_route.get('/register',accessControl.register);
user_route.post('/register',mailcheck.checkDuplicateEmail,accessControl.insertUser);

user_route.get('/otp', accessControl.otpload); // Ensure this route exists in your controller
user_route.post('/otp',accessControl.verifyOtp)
user_route.get('/resend-otp', accessControl.resendOtp);

// google login ----------------
user_route.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))
user_route.get("/auth/google/callback",passport.authenticate('google',{
  successRedirect:'/sucess',
  failureRedirect:'/failure'
}))
user_route.get("/sucess",googleLogin.sucessGoogleLogin);
user_route.get("/failure",googleLogin.failureGoogleLogin)

//facebook login
user_route.get('/auth/facebook',passport.authenticate('facebook',{scope:['public_profile','email']}));
user_route.get("/auth/facebook/callback",passport.authenticate('facebook',{
  successRedirect:'/sucessfacebook',
  failureRedirect:'/failurefacebook'
}))
user_route.get("/sucessfacebook", facebookLogin.sucessfacebookLogin);
user_route.get("/failurefacebook", facebookLogin.failurefacebookLogin);

// login 
user_route.get('/login',accessControl.loaginLoad);
user_route.post('/login',accessControl.verifyLogin)

user_route.get('/forgotPassword/email',accessControl.forgotPasswordEmail);
user_route.post('/forgotPassword/email',accessControl.ForgotPasswordOtp)
user_route.get('/forgotPassword/otp',accessControl.loadForgotPasswordOtp)
user_route.post('/forgotPassword/otp',accessControl.verifyForgotPasswordOtp)
user_route.get('/forgotPassword/resend-otp', accessControl.forgotPasswordresendOtp);
user_route.get('/forgotpassword/changepassword',accessControl.loadChangePassword);
user_route.post('/forgotpassword/changepassword',accessControl.changePassword);

user_route.get('/product/:id',homeAndOrder.productLoad);
user_route.post('/product/review/:productId',homeAndOrder.review)
user_route.get('/product/productZoom/:productId',homeAndOrder.productZoom);

user_route.get('/shop',homeAndOrder.loadShop);
user_route.get('/inCartAndWishlist/:productId/:size',cart.incartAndWishlist)
user_route.get('/addToCart/:productId/:size', cart.addToCart);
user_route.get('/removeFromCart/:productId',cart.removeFromCart)
user_route.get('/cart',userAuth.isLogin,cart.loadCart);
user_route.get('/cart/:counter/:productId/:size',cart.productCount)

user_route.get('/accountDetails',userAuth.isLogin,accounts.accountDetails);
user_route.post('/accountDetails',accounts.updateDetails);
user_route.get('/address',userAuth.isLogin,accounts.loadAddress)
user_route.get('/addAddress',userAuth.isLogin,accounts.loadAddAddress) 
user_route.post('/addAddress',accounts.addAddress);
user_route.get('/editAddress/:id',userAuth.isLogin,accounts.loadEditAddress);
user_route.post('/editAddress/:id',accounts.editAddress);
user_route.get('/deleteAddress/:id',accounts.deleteAddress);
user_route.get('/checkOut',userAuth.isLogin,homeAndOrder.checkOut);
user_route.get('/checkOutEditAddress/:id',homeAndOrder.checkOutLoadEditAddress)
user_route.post('/checkOutEditAddress/:id',homeAndOrder.checkOutEditAddress)
user_route.get('/checkOutDeleteAddress/:id',homeAndOrder.chekOutDeleteAddress);
user_route.get('/checkOutAddAddress',userAuth.isLogin,homeAndOrder.checkOutLoadAddAddress) 
user_route.post('/checkOutAddAddress',homeAndOrder.checkOutAddAddress) 
user_route.get('/placeOrder/:addressId/:couponCode/:paymentMethod',userAuth.isLogin,homeAndOrder.placeOrder) 
user_route.get('/orderSuccess/:orderId',homeAndOrder.orderSuccess);
user_route.get('/orders',userAuth.isLogin,accounts.orders) 
user_route.get('/orderDetails/:orderId',accounts.orderDetails);

user_route.get('/cancelOrder/:orderId',userAuth.isLogin,accounts.cancelOrder);
user_route.get('/returnOrder/:orderId',userAuth.isLogin,accounts.ReturnOrder);

user_route.get('/singleProductCheckout/:productId/:size',userAuth.isLogin,homeAndOrder.singleProductCheckout)
user_route.get('/singleProductOrder/:productId/:count/:addressId/:size/:couponCode/:paymentMethod',userAuth.isLogin,homeAndOrder.singleProductOrder);
user_route.get('/singleCheckoutEditAddress/:id/:productId/:size',userAuth.isLogin,homeAndOrder.singleCheckOutLoadEditAddress);
user_route.post('/singleCheckoutEditAddress/:id/:productId/:size',userAuth.isLogin,homeAndOrder.singleCheckOutEditAddress);
user_route.get('/singleCheckoutAddAddress/:productId/:size',userAuth.isLogin,homeAndOrder.singleCheckOutLoadAddAddress);
user_route.post('/singleCheckoutAddAddress/:productId/:size',userAuth.isLogin,homeAndOrder.singleCheckOutAddAddress);
user_route.get('/addToWishlist/:productId/:size',wishlist.addToWishlist);
user_route.get('/wishlist',userAuth.isLogin,wishlist.loadWishlist)
user_route.get('/removeFromWishlist/:wishlistId',wishlist.removeFromWishlist)
user_route.post('/applyCoupon',coupon.applyCoupon);
user_route.get('/removeCoupon',coupon.removeCoupon)
user_route.post('/applyCouponSingleProduct',coupon.applyCoupon);
user_route.get('/removeCouponSingleProduct',coupon.removeCoupon)
user_route.get('/paypal',payment.payProduct);
user_route.get('/paymentsuccess',payment.success)
user_route.get('/paymentcancel',payment.cancel)
user_route.get('/buyNowPaypal',payment.buyNowPayProduct);
user_route.get('/buyNowPaymentsuccess',payment.buyNowSuccess)
user_route.get('/buyNowPaymentcancel',payment.buyNowCancel);
user_route.get('/wallet',userAuth.isLogin,wallet.loadWallet);
user_route.get('/wallet/addMoney',userAuth.isLogin,wallet.loadAddMoney)
user_route.post('/wallet/addMoney',wallet.addMoney)

user_route.get('/walletPaypal/:amount',wallet.payProduct);
user_route.get('/walletpaymentsuccess',wallet.success)
user_route.get('/walletpaymentcancel',wallet.cancel)

user_route.get('/downloadInvoice/:orderId',userAuth.isLogin,payment.downloadInvoice);
user_route.get('/paymentRetry/:orderId',userAuth.isLogin,payment.paymentRetry);
user_route.get('/retryPaymentSuccess/:orderId',userAuth.isLogin,payment.retrySuccess);
user_route.get('/retryPaymentCancel/:orderId',userAuth.isLogin,payment.retryCancel);



user_route.get('/logout',accounts.logout)
user_route.get('*',function(req,res){
  res.render('404');         //after localhost.../admin whatever the parameter passed it redirect to /admin again
  })

module.exports=user_route;
