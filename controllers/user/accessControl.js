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

const crypto = require("crypto");
const nodemailer = require("nodemailer");

const register = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

// for crypting the password
const bcrypt = require("bcrypt");
const { log } = require("console");
// const product = require("../models/product");
// const { findOne } = require("../models/adminmodel");
const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// Nodemailer transporter setup----------------------------------

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "novafassion4men@gmail.com",
      pass: process.env.NODEMAILER_PASS,
    },
  });


//console.log("Client ID:", process.env.NODEMAILER_CLIENT_ID);
//console.log("Client Secret:", process.env.NODEMAILER_CLIENT_SECRET);
//console.log("Refresh Token:", process.env.NODEMAILER_REFRESH_TOKEN);

// node mailer using tocken 
//const  transporter = nodemailer.createTransport({      
 // host: "smtp.gmail.com",
 // auth: {
   // type: "OAuth2",
   // user: "novafassion4men@gmail.com",
   // clientId: process.env.NODEMAILER_CLIENT_ID,
   // clientSecret: process.env.NODEMAILER_CLIENT_SECRET,
   // refreshToken: process.env.NODEMAILER_REFRESH_TOKEN
 // }
//});




// to insert the user
const insertUser = async (req, res) => {
  try {
    // console.log(req.body);
    const spassword = await securepassword(req.body.password); //get password here and make it crypted
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: spassword,
    });
    req.session.tempUser = user;

    // Generate OTP----------------------------------------
    const otp = crypto.randomInt(1000, 9999).toString();

    // Store OTP and expiry in session-----------------------------------
    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 120000;

    // Send OTP to the user's email
    const mailOptions = {
      from: "novafassion4men@gmail.com",
      to: req.body.email,
      subject: "OTP for Email Verification",
      text: `Your OTP is ${otp}. It will expire in 2  minutes.from nova fassions by Yadhukrishnan`,
    };

    await transporter.sendMail(mailOptions);

    req.session.useremail = req.body.email;
    res.redirect("/otp");
  } catch (error) {
    console.log(error);
  }
};

const otpload = async (req, res) => {
  try {
    res.render("otp", {
      email: req.session.useremail,
      timeLimit: req.session.otpExpiry,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// verify otp
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.useremail;

    // Check if OTP is valid and not expired
    if (req.session.otp && req.session.otpExpiry > Date.now()) {
      if (otp === req.session.otp) {
        // OTP verified successfully
        const tempUser = req.session.tempUser;

        console.log("Entered OTP:", otp);
        console.log("Stored OTP:", req.session.otp);

        // Clear OTP and temp data from session
        req.session.otp = null;
        req.session.otpExpiry = null;
        req.session.tempUser = null;

        // Save the user to the database after OTP verification
        const user = new User(tempUser);
        const userData = await user.save();

        // create a wallet for user and give welcome bonus
        const walletdata = new Wallet({
          user: userData._id,
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

        if (userData) {
          // Redirect to success or login page after successful registration
          req.flash("success", "registration sucess now login");
          res.redirect("/login");
        } else {
          req.flash("error", "User registration failed!");
          res.redirect("/register");
        }
      } else {
        req.flash("error", "Invalid OTP");
        res.redirect("/otp");
      }
    } else {
      req.flash("error", "OTP has expired or is invalid");
      res.redirect("/otp");
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/otp");
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session.useremail;

    if (!email) {
      req.flash("error", " Please register again.");
      return res.redirect("/register");
    }

    // Generate new OTP
    const newOtp = crypto.randomInt(1000, 9999).toString();

    // Update OTP and expiry in session
    req.session.otp = newOtp;
    req.session.otpExpiry = Date.now() + 120000; // OTP valid for 2 minutes

    // Send OTP to the user email
    const mailOptions = {
      from: "novafassion4men@gmail.com",
      to: email,
      subject: "Resend OTP for Email Verification",
      text: `Your new OTP is ${newOtp}. It will expire in 2 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success", "A new OTP has been sent to your email.");
    return res.redirect("/otp");
  } catch (error) {
    console.log(error);
    req.flash("error", "Error resending OTP. Please try again.");
    return res.redirect("/otp");
  }
};

//  for user login load
const loaginLoad = async (req, res) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/accountDetails");
    } // to check alreedy logged in or logged out for the showing log in page and account details accordingly
    else {
      return res.render("login");
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      if (!userData.is_active) {
        return res.json({ success: false, message: "user is blocked" });
      }
      if (!userData.password) {
        return res.json({
          success: false,
          message: "Email and passcode is incorrect",
        });
      }

      // res.json({success:false,message:'Email and passcode is incorrect'})
      // req.flash('error', 'Email and passcode is incorrect');  //you registered through google so sign in with google

      const passwordMatch = await bcrypt.compare(password, userData.password);
      // console.log(passwordMatch);

      if (passwordMatch) {
        req.session.user_id = userData._id;

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
    }
  } catch (error) {
    console.log(error);
  }
};

// render forgot password email
const forgotPasswordEmail = async (req, res) => {
  try {

    res.render("forgotPasswordEmail");
  } catch (error) {
    console.log(error);
  }
};

// posted email retrive here and sent otp
const ForgotPasswordOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (!userData) {
      req.flash("error", "user not exist");
      return res.redirect("/forgotPassword/email");
    }

    // Generate OTP----------------------------------------
    const otp = crypto.randomInt(1000, 9999).toString();

    // Store OTP and expiry in session-----------------------------------
    req.session.userData = userData;
    req.session.useremail = email;
    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 120000;

    // Send OTP to the user's email
    const mailOptions = {
      from: "novafassion4men@gmail.com",
      to: req.body.email,
      subject: "OTP for Email Verification",
      text: `Your OTP for forgot password is ${otp}. It will expire in 2 minutes .`,
    };

    await transporter.sendMail(mailOptions);

    //  req.session.useremail = req.body.email;
    console.log(otp);

    res.redirect("/forgotPassword/otp");
  } catch (error) {
    console.log(error);
  }
};

const loadForgotPasswordOtp = async (req, res) => {
  try {
    res.render("forgotPasswordOtp", {
      timeLimit: req.session.otpExpiry,
      email: req.session.useremail,
    });
  } catch (error) {
    console.log(error);
  }
};

const forgotPasswordresendOtp = async (req, res) => {
  try {
    const email = req.session.useremail;

    if (!email) {
      req.flash("error", " email not found.");
      return res.redirect("/login");
    }

    // Generate new OTP
    const newOtp = crypto.randomInt(1000, 9999).toString();

    // Update OTP and expiry in session
    req.session.otp = newOtp;
    req.session.otpExpiry = Date.now() + 120000; // OTP valid for 5 minutes

    // Send OTP to the user email
    const mailOptions = {
      from: "novafassion4men@gmail.com",
      to: email,
      subject: "Resend OTP for Email Verification",
      text: `Your new OTP is ${newOtp}. It will expire in 2 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success", "A new OTP has been sent to your email.");
    return res.redirect("/forgotPassword/otp");
  } catch (error) {
    console.log(error);
    req.flash("error", "Error resending OTP. Please try again.");
    return res.redirect("/forgotPassword/otp");
  }
};

const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const otp = req.body.otp;

    if (req.session.otp && req.session.otpExpiry > Date.now()) {
      if (otp === req.session.otp) {
        // OTP verified successfully

        // Clear OTP and temp data from session
        req.session.otp = null;
        req.session.otpExpiry = null;
        req.session.tempUser = null;
        res.redirect("/forgotPassword/changepassword");
      } else {
        req.flash("error", "invalid otp");
        res.redirect("/forgotPassword/otp");
      }
    } else {
      req.flash("error", "otp is expired");
      res.redirect("/forgotPassword/otp");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadChangePassword = async (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    console.log(error);
  }
};

const changePassword = async (req, res) => {
  try {
    const password = req.body.password;
    const userData = req.session.userData;

    const newPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(userData._id, { password: newPassword });
    req.flash("success", "password changed sucessfully");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  register,
  insertUser,
  loaginLoad,
  verifyLogin,
  verifyOtp,
  otpload,
  resendOtp,
  forgotPasswordEmail,
  ForgotPasswordOtp,
  verifyForgotPasswordOtp,
  loadForgotPasswordOtp,
  forgotPasswordresendOtp,
  loadChangePassword,
  changePassword,
};
