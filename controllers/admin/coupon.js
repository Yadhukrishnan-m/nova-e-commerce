const User = require("../../models/usermodel");
const Admin = require("../../models/adminmodel");
const Category = require("../../models/category");
const Product = require("../../models/product");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Coupon = require("../../models/coupon");

const couponLoad = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("coupons", { coupons });
  } catch (error) {
    console.log(error);
  }
};
const addCoupon = async (req, res) => {
  try {
    const { code, discount, minOrder, maxDiscount, expiryDate, limitPerUser } =
      req.body;
    const coupon = new Coupon({
      code,
      discount,
      minOrder,
      maxDiscount,
      expiryDate: new Date(expiryDate),
      limitPerUser,
    });
    await coupon.save();
    req.flash("successMsg", "successfully added");
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error);
  }
};

const editCouponLoad = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    res.render("couponEdit", { coupon });
  } catch (error) {
    console.log(error);
  }
};

const editCoupon = async (req, res) => {
  try {
    const {
      code,
      discount,
      minOrder,
      maxDiscount,
      expiryDate,
      limitPerUser,
      description,
    } = req.body;
    console.log(req.params.id);

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, {
      code: code,
      discount: discount,
      minOrder: minOrder,
      maxDiscount: maxDiscount,
      expiryDate: new Date(expiryDate),
      limitPerUser: limitPerUser,
    });

    req.flash("successMsg", "successfully updated");
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    req.flash("successMsg", "Coupon deleted successfully");
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  couponLoad,
  addCoupon,
  editCoupon,
  editCouponLoad,
  deleteCoupon,
};
