const Product = require('../models/product');
const CategoryOffer = require('../models/categoryOffer');

const calculateBestOfferPrice = async (productId) => {
  try {
    const product = await Product.findById(productId).populate('category');
    
    if (!product) throw new Error('Product not found');

    const categoryOffer = await CategoryOffer.findOne({ category: product.category._id });

    const productDiscount = product.discount ?? 0;
    const categoryDiscount = categoryOffer?.discount ?? 0;

    const bestDiscount = Math.max(productDiscount, categoryDiscount);
    const offerPrice = bestDiscount > 0 ? Math.round(product.mrp * (1 - bestDiscount / 100)) : product.mrp;

    return { offerPrice:Math.round(offerPrice), bestDiscount: Math.round(bestDiscount) };
  } catch (error) {
    console.error("Error calculating best offer price:", error);
  }
};



module.exports = calculateBestOfferPrice;
