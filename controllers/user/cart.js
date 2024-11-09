
const User = require("../../models/usermodel");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Review = require("../../models/review");
const Cart = require("../../models/cart");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Wishlist = require("../../models/wishlist");
const Coupon = require("../../models/coupon");
const Wallet = require("../../models/wallet");
const bestOfferPrice=require('../../services/discountCalculator')


const addToCart = async (req, res) => {
    try {
      const user = await User.findById(req.session.user_id);
      if (!req.session.user_id) {
        req.flash("error", "You need to be logged in to add items to the cart.");
        return res.json({ error: "user not logged in " });
      }
  
      const existingCart = await Cart.findOne({
        user: req.session.user_id,
        product: req.params.productId,
       size: req.params.size
      });
      const product = await Product.findById(req.params.productId);
  
      if (existingCart) {
        // res.redirect(`/cart`)
        return res.json({ exists: true });
      } else {
        const cart = new Cart({
          user: req.session.user_id,
          product: req.params.productId,
          size: req.params.size,
        });
  
        await cart.save();
  
        return res.json({ exists: false, message: "successfully added" });
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  const removeFromCart = async (req, res) => {
    try {
      await Cart.findOneAndDelete({
        user: req.session.user_id,
        product: req.params.productId,
      });
      res.redirect("/cart");
    } catch (error) {
      console.log(error);
    }
  };
  
const incartAndWishlist=async(req,res)=>{
  try {
 let inCart=false
 let inWishlist=false
 const  cart=await  Cart.findOne({user: req.session.user_id,product:req.params.productId,size:req.params.size})   
 const  wishlist=await  Wishlist.findOne({user: req.session.user_id,product:req.params.productId,size:req.params.size})   

    if(cart){
         inCart=true
    }
    if (wishlist) {
      inWishlist=true
    }
    res.json({inCart,inWishlist})
  } catch (error) {
    console.log(error);
    
  }
}

  const loadCart = async (req, res) => {
    try {
      if (!req.session.user_id) {
        req.flash("error", "please login ");
        return res.redirect("/login");
      }
      let totalPrice = 0;
      let totalOfferPrice = 0;
      const cart = await Cart.find({ user: req.session.user_id }).populate(
        "product"
      );
      const cartWithOffers = await Promise.all(
        cart.map(async (cartItem) => {
          const { offerPrice, bestDiscount } = await bestOfferPrice(cartItem.product._id);
          cartItem.bestOfferPrice = offerPrice;
          cartItem.bestDiscount = bestDiscount;
          totalOfferPrice += offerPrice * cartItem.count;
          totalPrice += cartItem.product.mrp * cartItem.count;

          return cartItem;
        })
      );
  
      const discount = totalPrice - totalOfferPrice;
  
      res.render("cart", { cart: cartWithOffers, totalPrice, totalOfferPrice, discount });
    } catch (error) {
      console.log(error);
    }
  };
   
  const productCount = async (req, res) => {
    try {
      const cart = await Cart.findOne({
        user: req.session.user_id,
        product: req.params.productId,
         size:req.params.size
      }).populate("product");
      let size;
      if (cart.size == "M") {
        size = cart.product.stockM;
      } else if (cart.size == "S") {
        size = cart.product.stockS;
      } else if (cart.size == "L") {
        size = cart.product.stockL;
      } else if (cart.size == "XL") {
        size = cart.product.stockXL;
      } else if (cart.size == "XXL") {
        size = cart.product.stockXXL;
      }
      if (req.params.counter == 1) {
        if (cart.count < 5) {
          if (size > cart.count) {
            cart.count += 1;
            await cart.save();
          } else {
            return res.json({ error: "Quantity not available" });
          }
        } else {
     
          return res.json({ error: "limit reached" });
        }
      } else if (req.params.counter == -1) {
        if (cart.count > 1) {
          cart.count -= 1;
          await cart.save();
        } else {
          return res.json({ error: "minimum one required" });
        }
      }
      const carts = await Cart.find({ user: req.session.user_id }).populate(
        "product"
      );
      let totalPrice = 0;
      let totalOfferPrice = 0;
      const { offerPrice, bestDiscount } = await bestOfferPrice(cart.product._id);

      const offerPrices = await Promise.all(
        carts.map((x) => bestOfferPrice(x.product._id)) 
      );
      
   
      carts.forEach((x, index) => {
        const { offerPrice, bestDiscount } = offerPrices[index]; 
      
          totalOfferPrice += offerPrice * x.count; 
      
        totalPrice += x.product.mrp * x.count; 
      });
      let discount = totalPrice - totalOfferPrice;
  
      return res.json({
        count: cart.count,
        offerPrice:offerPrice,
        totalPrice: totalPrice,
        totalOfferPrice: totalOfferPrice,
        discount: discount,
      });
    } catch (error) {
      console.log(error);
      return res.json({ success: false, message: "Something went wrong" });
    }
  };
  
  
module.exports={
    addToCart,
    removeFromCart,
    loadCart,
    productCount,
    incartAndWishlist
             }  