
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


const addToWishlist = async (req, res) => {
    try {
      if (!req.session.user_id) {
        req.flash(
          "error",
          "You need to be logged in to add items to thewishlist ."
        );
        return res.json({ status: "notLogedIn" });
      }
  
      const isWishlisted = await Wishlist.findOne({
        user: req.session.user_id,
        product: req.params.productId,
        size:req.params.size
      });
  
      if (isWishlisted) {
        await Wishlist.findOneAndDelete({
          user: req.session.user_id,
          product: req.params.productId,
          size:req.params.size
        });
        return res.json({ status: "removed" });
      } else {
        const wishlist = new Wishlist({
          user: req.session.user_id,
          product: req.params.productId,
          size: req.params.size,
        });
        wishlist.save();
  
        return res.json({ status: "added" });
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  const loadWishlist = async (req, res) => {
    try {
      let wishlist = await Wishlist.find({ user: req.session.user_id }).populate(
        "product"
      );
      wishlist = await Promise.all(

        wishlist.map(async (cur) => {
          const { offerPrice, bestDiscount } = await bestOfferPrice(cur.product._id);
          
            
          cur.bestOfferPrice=offerPrice
          const inCart = await Cart.findOne({
            user: req.session.user_id,
            product: cur.product._id,
            size:cur.size
          });
          return {
            ...cur._doc, // Spread current wishlist document
            inCart: !!inCart, // Add inCart flag
            bestOfferPrice: offerPrice
          };
        })
      );
  
  
      res.render("wishlist", { wishlist });
    } catch (error) {
      console.log(error);
    }
  };
  
  const removeFromWishlist = async (req, res) => {
    try {
      await Wishlist.findByIdAndDelete(req.params.wishlistId);
      res.redirect("/wishlist");
    } catch (error) {
      console.log(error);
    }
  };


  module.exports={
    addToWishlist,
    loadWishlist,
    removeFromWishlist,
  }