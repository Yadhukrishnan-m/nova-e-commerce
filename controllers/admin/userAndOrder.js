const User = require("../../models/usermodel");
const Admin = require("../../models/adminmodel");
const Category = require("../../models/category");
const Product = require("../../models/product");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Wallet = require("../../models/wallet");

const fs = require("fs");
const path = require("path");

const loadLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.log(error);
  }
};
//to crypt the password
const bcrypt = require("bcrypt");
const { ifError } = require("assert");
// const product = require("../models/product");
// const securepassword=async(password)=>{
//     try {
//         const passwordHash = await bcrypt.hash(password,10);
//         return passwordHash;
//     } catch (error) {
//         console.log(error.message);

//     }
// }

const verifyAdmin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await Admin.findOne({ email: email });
    if (adminData) {
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      if (passwordMatch) {
        req.session.admin_id = adminData._id;
        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "Email and passcode is incorrect",
        });
      }
    } else {
      return res.json({
        success: false,
        message: "Email and passcode is incorrect",
      });
      // res.render('adminLogin',{message:'error'})
    }
  } catch (error) {
    console.log(error);
  }
};

// to load users page
const loadusers = async (req, res) => {
  try {
    const userData = await User.find();
    res.render("users", { userData });
  } catch (error) {
    console.log(error);
  }
};

// to block and unblock uer
const userStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      req.flash("errorMsg", "User not found");
      return res.redirect("/admin/users");
    }

    user.is_active = user.is_active === 1 ? 0 : 1;
    await user.save(); // Save the updated user

    req.flash("successMsg", `User status updated successfully`);
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error);
    req.flash("errorMsg", "An error occurred while updating user status");
    res.redirect("/admin/users");
  }
};

const orders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("products.productId")
      .sort({ orderDate: -1 });
    res.render("orders", { orders });
  } catch (error) {
    console.log(error);
  }
};

const changeStatus = async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.orderId, {
      orderStatus: req.params.status,
    });
    const order = await Order.findById(req.params.orderId);
    const user = order.user;

    const total = order.orderTotal;
    if (order.paymentMethod !== "COD") {
      if (order.orderStatus == "cancelled") {
        const wallet = await Wallet.findOneAndUpdate(
          { user: user },
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
      } else if (order.orderStatus === "Return success") {
        const wallet = await Wallet.findOneAndUpdate(
          { user: user },
          {
            $push: {
              transaction: {
                amount: total, // Update the balance
                date: new Date(),
                transactionMode: "Refund Due to Order Return",
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
      }
    } else {
      if (order.orderStatus === "Return success") {
        const wallet = await Wallet.findOneAndUpdate(
          { user: user },
          {
            $push: {
              transaction: {
                amount: total, // Update the balance
                date: new Date(),
                transactionMode: "Refund Due to Order Return",
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
      } else if (order.orderStatus === "cancelled") {
        await Order.findByIdAndUpdate(req.params.orderId, {
          paymentStatus: "cancelled",
        });
      }
    }
    if (order.orderStatus === "delivered") {
      await Order.findByIdAndUpdate(order._id, { paymentStatus: "completed" });
    }

    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      res.clearCookie("admin_session");
      return res.redirect("/admin");
    });
  } catch (error) {
    console.log(error);
  }
};


module.exports = {
  loadLogin,
  verifyAdmin,
  loadusers,
  userStatus,
  orders,
  changeStatus,
  logout,

};
