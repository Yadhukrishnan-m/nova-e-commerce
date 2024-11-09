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

const sucessGoogleLogin = async (req, res) => {
  try {
    const { emails } = req.user;
    const { displayName } = req.user;
    const email = emails[0].value;
    console.log(displayName, emails[0].value);

    let userData = await User.findOne({ email: email }); //to check the user is alredy in database
    if (!userData) {
      // If user does not exist, create a new one
      const user = new User({
        name: displayName,
        email: email,
      });

      const userdata = await user.save();

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

      // Save the user in the database
      // console.log("User saved successfully");
    } else {
      // console.log("User already exists");
    }
    userData = await User.findOne({ email: email }); // again get the user data to insert in session
    req.session.user_id = userData._id;

    if (userData.is_active == 0) {
      req.flash("error", "user is blocked  ");
      return res.redirect("/login");
    }

    res.redirect("/");
    console.log("sucessgoogle login");
  } catch (error) {
    console.log(error);
  }
};

const failureGoogleLogin = async (req, res) => {
  try {
    req.flash("error", "google login failed ");
    res.redirect("/login");
    console.log("faile google  login");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  sucessGoogleLogin,
  failureGoogleLogin,
};
