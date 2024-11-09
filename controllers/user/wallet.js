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

const loadWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.session.user_id });

    const currentPage = parseInt(req.query.page) || 1;
    const limit = 5;
    const totalPages = Math.ceil(wallet.transaction.length / limit);

    const transaction = wallet.transaction.slice(
      (currentPage - 1) * limit,
      currentPage * limit
    );

    res.render("wallet", { wallet, transaction, currentPage, totalPages });
  } catch (error) {
    console.log(error);
  }
};

const loadAddMoney = async (req, res) => {
  try {
    res.render("addMoney");
  } catch (error) {
    console.log(error);
  }
};

const addMoney = async (req, res) => {
  try {
    const { paymentMethod, amount } = req.body;
    res.redirect(`/WalletPaypal/${amount}`);
  } catch (error) {
    console.log(error);
  }
};

//add money paypal starts here

const paypal = require("paypal-rest-sdk");

const axios = require("axios");

const convertCurrency = require("../../services/currencyConverter");
paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_KEY,
});

const payProduct = async (req, res) => {
  try {
    const amount = req.params.amount;
    let total = await convertCurrency(amount, "INR", "USD");
    req.session.walletAddAmount = amount;

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `http://${process.env.domainUrl}walletpaymentsuccess`,
        cancel_url: `http://${process.env.domainUrl}/walletpaymentcancel`,
      },
      transactions: [
        {
          item_list: {
            // "items": [{
            //     "name": "Red Sox Hat",
            //     "sku": "001",
            //     "price": "25.00",
            //     "currency": "USD",
            //     "quantity": 1
            // }]
          },
          amount: {
            currency: "USD",
            total: total,
          },
          // "description": "Hat for the best team ever"
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const success = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const amount = req.session.walletAddAmount;
  let total = await convertCurrency(amount, "INR", "USD");

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: total,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    async function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        const wallet = await Wallet.findOneAndUpdate(
          { user: req.session.user_id },
          {
            $push: {
              transaction: {
                amount: amount, // Update the balance
                date: new Date(),
                transactionMode: "added money to wallet",
              },
            },
            $inc: {
              balance: amount, // Update the balance
            },
          }
        );
        req.session.walletAddAmount = null;
        req.flash("success", "amount added successfully");
        res.redirect(`/wallet`);
      }
    }
  );
};

const cancel = async (req, res) => {
  try {
    req.session.walletAddAmount = null;
    req.flash("error", "payment failed");
    res.redirect(`/wallet`);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadWallet,
  loadAddMoney,
  addMoney,
  payProduct,
  cancel,
  success,
};
