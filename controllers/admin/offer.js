

const User = require("../../models/usermodel");
const Admin = require("../../models/adminmodel");
const Category = require("../../models/category");
const Product = require("../../models/product");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Wallet = require("../../models/wallet");
const categoryOffer=require('../../models/categoryOffer');
const fs = require("fs");
const path = require("path");


const productOfferLoad = async (req, res) => {
    try {
      const products = await Product.find();
      res.render("productOffers", { products });
    } catch (error) {
      console.log(error);
    }
  };
  
  const productOfferEditLoad = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
  
      res.render("productOfferEdit", { product });
    } catch (error) {
      console.log();
    }
  };
  
  const productOfferEdit = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      product.discount = req.body.discount;
  
      const offerPrice = Math.round(
        product.mrp - product.mrp * (req.body.discount / 100)
      );
  
      product.offerIsActive = 1;
      product.offerPrice = offerPrice;
      product.save();
      //  await Product.findByIdAndUpdate(req.params.id,{discount:req.body.discount,offerExpiry:new Date(req.body.date),offerIsActive:1})
      req.flash("successMsg",'offer updated')
      res.redirect("/admin/productOffer");
    } catch (error) {}
  };
  
  const productOfferDelete = async (req, res) => {
    try {
      const productId = req.params.id;

      const product = await Product.findById(productId);
    
      product.discount = 0;
      product.offerPrice = product.mrp;

      await product.save();  
    
      req.flash("successMsg",'offer deleted')
      res.redirect("/admin/productOffer");
    } catch (error) {
      console.log(error);
    }
  };
  
  const categoryOfferLoad = async (req, res) => {
    try {
     
      const categoryOffers=await categoryOffer.find().populate('category');
      const offeredCategoryIds = categoryOffers.map(offer => offer.category._id);
      const categories = await Category.find({ _id: { $nin: offeredCategoryIds } });
      res.render("categoryOffers", { categories,categoryOffers });
    } catch (error) {
      console.log(error);
    }
  };
    
  const addOffer=async (req,res)=>{
    try {
      const {name,discount,category}=req.body
      const offer=new categoryOffer({
        name:name,
        discount:discount,
        category:category
      })
      await offer.save();
      req.flash("successMsg",'offer created')
      res.redirect('/admin/categoryOffer');
    } catch (error) {
      console.log(error);
      
    }
  }
 
  
  const categoryOfferEditLoad = async (req, res) => {
    try {
      const categoryoffer = await categoryOffer.findOne({category:req.params.id}).populate('category');
  
      res.render("categoryOfferEdit", { categoryoffer });
    } catch (error) {
      console.log(error);
    }
  };
  
  const categoryOfferEdit = async (req, res) => {
    try {
      const { discount,name } = req.body;
    
      await categoryOffer.findOneAndUpdate(
        { category: req.params.id },  
        { discount: discount, name: name },  
       
    );
  
      req.flash("successMsg", "successfully updated");
      res.redirect("/admin/categoryOffer");
    } catch (error) {}
  };
  
  const categoryOfferDelete=async(req,res)=>{
    try {
      await categoryOffer.findOneAndDelete( { category: req.params.id })
      req.flash("successMsg", "successfully deleted");
      res.redirect("/admin/categoryOffer");
    } catch (error) {
      console.log(error);
      
    }
  }

  module.exports={
    productOfferLoad,
    productOfferEditLoad,
    productOfferEdit,
    productOfferDelete,
    categoryOfferLoad,
    addOffer,
    categoryOfferEditLoad,
    categoryOfferEdit,
    categoryOfferDelete
  }
