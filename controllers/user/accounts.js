
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

const accountDetails = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    res.render("accountDetails", { user });
  } catch (error) {
    console.log(error);
  }
};

const updateDetails = async (req, res) => {
  try {
    const name = req.body.name;
    const dateOfBirth = req.body.dob;
    const mobile = req.body.mobile;

    await User.findByIdAndUpdate(req.session.user_id, {
      name: name,
      dateOfBirth: dateOfBirth,
      mobile: mobile,
    });
    res.redirect("/accountDetails");
  } catch (error) {
    console.log(error);
  }
};

const loadAddress = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.session.user_id });

    res.render("address", { addresses });
  } catch (error) {
    console.log(error);
  }
};

const loadAddAddress = async (req, res) => {
  try {
    res.render("addAddress");
  } catch (error) {
    console.log(error);
  }
};

const addAddress = async (req, res) => {
  try {
    const address = new Address({
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });
    const addressData = await address.save();

    if (addressData) {
      req.flash("success", "successfully added");
      res.redirect("/address");
    }
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      return res.redirect("/");
    });
  } catch (error) {
    console.log(error);
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    res.render("editAddress", { address });
  } catch (error) {
    console.log(error);
  }
};

const editAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndUpdate(req.params.id, {
      user: req.session.user_id,
      street: req.body.street,
      houseName: req.body.houseName,
      landmark: req.body.landmark,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      zip: req.body.zip,
      addressType: req.body.addressType,
      mobile: req.body.mobile,
      altMobile: req.body.altMobile,
    });

    req.flash("success", "successfully edited");
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.id);

    req.flash("success", "successfully deleted");
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};


const orders = async (req, res) => {
    try {
      //  const orders=await Order.find({user:req.session.user_id}).populate( 'products.productId')
      const orders = await Order.find({ user: req.session.user_id })
        .populate("products.productId")
        .sort({ orderDate: -1 }); // Sort by createdAt in descending order (-1 for descending, 1 for ascending)
  
      res.render("orders", { orders });
    } catch (error) {
      console.log(error);
    }
  };
  
  const orderDetails = async (req, res) => {
    try {
      const order = await Order.findOne({ orderId: req.params.orderId }).populate(
        "products.productId"
      );
  
      res.render("orderDetails", { order });
    } catch (error) {
      console.log(error);
    }
  };
  
  const cancelOrder = async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.orderId, {
        orderStatus: "cancelled",
      });
      const orders = await Order.findById(req.params.orderId).populate(
        "products.productId"
      );
      let total = orders.orderTotal;
      if (orders.paymentMethod !== "COD") {
        const wallet = await Wallet.findOneAndUpdate(
          { user: req.session.user_id },
          {
            $push: {
              transaction: {
                amount: total, // Update the balance
                date: new Date(),
                transactionMode: "Refund Due to Order Cancellation",
              },
            },
            $inc: {
              balance: total, // Update the balance
            },
          }
        );
        await Order.findByIdAndUpdate(req.params.orderId, {
          paymentStatus: "Refunded",
        });
      } else {
        await Order.findByIdAndUpdate(req.params.orderId, {
          paymentStatus: "cancelled",
        });
      }
  
      for (const item of orders.products) {
        let product = await Product.findById(item.productId);
        let cart = await Cart.findOne({
          user: req.session.user_id,
          product: item.productId,
        });
  
        if (item.size == "M") {
          product.stockM += item.quantity;
          await product.save();
        } else if (item.size == "S") {
          product.stockS += item.quantity;
          await product.save();
        } else if (item.size == "L") {
          product.stockL += item.quantity;
          await product.save();
        } else if (item.size == "XL") {
          product.stockSXL += item.quantity;
          await product.save();
        } else if (item.size == "XXL") {
          product.stockXXL += item.quantity;
          await product.save();
        }
      }
  
      const myorder = await Order.findById(req.params.orderId);
      res.json({ myorder });
    } catch (error) {
      console.log(error);
    }
  };
  
  const ReturnOrder = async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.orderId, {
        orderStatus: "Return request applied",
      });
  
      const orders = await Order.findById(req.params.orderId).populate(
        "products.productId"
      );
      const myorder = await Order.findById(req.params.orderId);
      console.log(myorder);
  
      res.json({ myorder });
    } catch (error) {
      console.log(error);
    }
  };
  


module.exports={
accountDetails,
updateDetails,
logout,
loadAddress,
loadAddAddress,
addAddress,
loadEditAddress,
editAddress,
deleteAddress,

orders,
orderDetails,

cancelOrder,

ReturnOrder,
}

