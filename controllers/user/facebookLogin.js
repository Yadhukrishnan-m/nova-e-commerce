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

const sucessfacebookLogin = async (req, res) => {
  try {
    const { displayName } = req.user;

    // Check if emails exist and are properly structured
    const email =
      req.user.emails && req.user.emails[0] ? req.user.emails[0].value : null;

    if (!email) {
      // Handle the case where the email is not available
      console.log("Email not provided by Facebook");
      console.log("Facebook Profile:", req.user);

      return res
        .status(400)
        .send("No email associated with the Facebook account.");
    }

    console.log(displayName, email);

    // Check if user is already in the database
    let userData = await User.findOne({ email: email });

    if (!userData) {
      // If the user does not exist, create a new one
      const user = new User({
        name: displayName,
        email: email,
      });

      const userdata = await user.save(); // Save the user in the database

      userData = userdata;
      // create a wallet for user and give welcome bonus
      const walletdata = new Wallet({
        user: userdata._id,
        balance: 100,
        transaction: [
          {
            amount: 100,
            transactionMode: "welcome bonus",
            date: new Date(),
          },
        ],
      });
      walletdata.save();

      console.log("User saved successfully");
      req.session.user_id = userdata._id;
    } else {
      console.log("User already exists");
    }
    req.session.user_id = userData._id;

    res.redirect("/");
    console.log("Success Facebook login");
  } catch (error) {
    console.log("Error during Facebook login:", error);
    res.status(500).send("An error occurred during Facebook login.");
  }
};

// for facebook failed login
const failurefacebookLogin = async (req, res) => {
  try {
    req.flash("error", "facebook login failed ");
    res.redirect("/login");
    console.log("faile facebook login");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  failurefacebookLogin,
  sucessfacebookLogin,
};
