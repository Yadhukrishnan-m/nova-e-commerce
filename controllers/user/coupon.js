const User = require("../../models/usermodel");
const Product = require("../../models/product");
const Category = require("../../models/category");
const Review = require("../../models/review");
const Cart = require("../../models/cart");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Wishlist = require("../../models/wishlist");

const Coupon = require("../../models/coupon");

// Function to validate the coupon
const validateCoupon = async (couponCode, orderValue, userId) => {
  try {
    const coupon = await Coupon.findOne({ code: couponCode });

    // Check if the coupon exists
    if (!coupon) {
      return { valid: false, message: "Coupon code does not exist." };
    }

    // Check if the coupon has expired
    const currentDate = new Date();
    if (coupon.expiryDate && coupon.expiryDate < currentDate) {
      return { valid: false, message: "Coupon has expired." };
    }

    // Check if the order value meets the minimum order value requirement
    if (orderValue < coupon.minOrder) {
      return {
        valid: false,
        message: `Minimum order value is ₹${coupon.minOrder}.`,
      };
    }

    // Check if the coupon has already been used by the user
    const orderCount = await Order.countDocuments({
      user: userId,
      appliedCoupon: couponCode,
    });
    if (orderCount >= coupon.limitPerUser) {
      return { valid: false, message: `usage limit reached` };
    }

    // Calculate the discount amount
    let discountAmount = Math.round((coupon.discount / 100) * orderValue);

    // Check if the discount exceeds the maximum allowed discount
    if (discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }

    // If all checks pass, the coupon is valid
    return { valid: true, discount: discountAmount };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      valid: false,
      message: "An error occurred while validating the coupon.",
    };
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, orderValue, existingDiscount } = req.body;

    const userId = req.session.user_id;

    const isvalid = await validateCoupon(couponCode, orderValue, userId);

    if (isvalid.valid) {
      const appliedDiscount = isvalid.discount;

      const newTotalDiscount =
        parseInt(existingDiscount) + parseInt(appliedDiscount);

      const totalPayableAmount =
        parseInt(orderValue) - parseInt(appliedDiscount);

      const finalPayableAmount =
        totalPayableAmount < 0 ? 0 : totalPayableAmount;
      res.json({
        success: true,
        message: "Coupon applied successfully.",
        discount: appliedDiscount,
        newTotalDiscount: newTotalDiscount,
        finalPayableAmount: finalPayableAmount,
        couponCode: couponCode,
      });
    } else {
      res.json({
        success: false,
        message: isvalid.message,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const removeCoupon = async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  applyCoupon,
  removeCoupon,
};
