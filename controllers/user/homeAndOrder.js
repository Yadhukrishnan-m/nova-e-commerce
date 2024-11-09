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
const bestOfferPrice=require('../../services/discountCalculator')
//  for sending email otp
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const home = async (req, res) => {
  try {
    let user = "";

    const products = await Product.find().populate("category");
     const productWithBestOfferPromises = products.map(async (product) => {
      const { offerPrice, bestDiscount } = await bestOfferPrice(product._id);

 
      return {
        ...product.toObject(),
        bestOfferPrice: offerPrice,
        bestDiscount: bestDiscount
      };
    });
    const productsWithBestOffers = await Promise.all(productWithBestOfferPromises); // used promis for avoiding many awaits work inside a loop
    return res.render("home", { products: productsWithBestOffers, user });
  } catch (error) {
    console.log(error.message);
  }
};

const productLoad = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id }).populate(
      "user"
    );
    const product = await Product.findById(req.params.id).populate("category");
    const products = await Product.find().populate("category");
// m is the checked default size so check it in render
    let inCart = await Cart.findOne({
      user: req.session.user_id,
      product: req.params.id,
      size:'M'
    });

    if (!inCart) {
      inCart = 0;
    } else {
      inCart = 1;
    }
    //for wishlist
    const isWishlisted = await Wishlist.findOne({
      user: req.session.user_id,
      product: req.params.id,
      size:'M'
    });

    // to find best offer

    const { offerPrice, bestDiscount } = await bestOfferPrice(product._id);

    product.bestOfferPrice = offerPrice;
    product.bestDiscount = bestDiscount;
// for the products in related section 
    const productWithBestOfferPromises = products.map(async (product) => {
      const { offerPrice, bestDiscount } = await bestOfferPrice(product._id);
      return {
        ...product.toObject(),
        bestOfferPrice: offerPrice,
        bestDiscount: bestDiscount
      };
    });
    const productsWithBestOffers = await Promise.all(productWithBestOfferPromises); // used promis for avoiding many awaits work inside a loop




    res.render("product", { product, products:productsWithBestOffers, reviews, inCart, isWishlisted });
  } catch (error) {
    console.log(error);
  }
};

const productZoom = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    res.render("productZoom", { product: product });
  } catch (error) {
    console.log(error);
  }
};

const review = async (req, res) => {
  try {
    const productId = req.params.productId;
    const description = req.body.comment;
    const date = new Date();
    if (req.session.user_id) {
      const userId = req.session.user_id;

      const review = new Review({
        product: productId,
        user: userId,
        description: description,
        date: date,
      });
      await review.save();
      req.flash("success", "thanks for your review");
      res.redirect(`/product/${productId}`);
    } else {
      req.flash("error", "login to post review");
      return res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadShop = async (req, res) => {
  try {
    // if (req.session.user_id) {
    //   const user = await User.findById(req.session.user_id);

    //   if (!user.is_active) {
    //     req.flash("error", "user is blocked ,please contact suport");
    //    return res.redirect("/login");

    //   }
    // }

    const {
      search,
      sort,
      category,
      available,
      page = 1,
      limit = 10,
    } = req.query;

    // Build the search object for filtering
    let filter = {};
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (available === "true") {
      filter.stock = { $gt: 0 }; // Only products with stock > 0
    }

    //  to build the sort object
    let sortOptions = {};
    if (sort) {
      switch (sort) {
        case "name-asc":
          sortOptions = { name: 1 };
          break;
        case "name-desc":
          sortOptions = { name: -1 };
          break;
        case "price-asc":
          sortOptions = { offerPrice: 1 };
          break;
        case "price-desc":
          sortOptions = { offerPrice: -1 };
          break;
        case "offer-asc":
          sortOptions = { discount: 1 };
          break;
        case "offer-desc":
          sortOptions = { discount: -1 };
          break;
        default:
          sortOptions = {};
      }
    }

    // pagination logic is here
    const pageNum = parseInt(page) || 1; // Default to page 1 if not provided
    const pageSize = 9; // Default to 10 products per page
    const skip = (pageNum - 1) * pageSize; // Calculate number of products to skip

    // Get total product count for pagination
    const totalProducts = await Product.countDocuments(filter);

    const categories = await Category.find();
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .populate("category");
    const totalPages = Math.ceil(totalProducts / pageSize);

    const productsWithBestOffers = await Promise.all( // for the calculation of best offer
      products.map(async (product) => {
        const { offerPrice, bestDiscount } = await bestOfferPrice(product._id);
        return {
          ...product.toObject(), // Convert to plain object to add custom fields
          bestOfferPrice: offerPrice,
          bestDiscount: bestDiscount,
        };
      })
    );

    res.render("shop", {
      products: productsWithBestOffers,
      categories,
      search,
      sort,
      category,
      currentPage: pageNum,
      totalPages,
      limit: pageSize,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const checkOut = async (req, res) => {
  try {
    let totalPrice = 0;
    let totalOfferPrice = 0;
    let delivery = 40;
    const cart = await Cart.find({ user: req.session.user_id }).populate(
      "product"
    );
    const addresses = await Address.find({ user: req.session.user_id });

    const wallet = await Wallet.findOne({ user: req.session.user_id });

    let isAvailable = 1;

    const offerPromises = cart.map((x) => bestOfferPrice(x.product._id));
    const offerPrices = await Promise.all(offerPromises);
 let stoploop=true
    let size;
    cart.forEach((x,index) => {
 
      const { offerPrice, bestDiscount } = offerPrices[index]; 

      if (x.size == "M") {
        size = x.product.stockM;
      } else if (x.size == "S") {
        size = x.product.stockS;
      } else if (x.size == "L") {
        size = x.product.stockL;
      } else if (x.size == "XL") {
        size = x.product.stockXL;
      } else if (x.size == "XXL") {
        size = x.product.stockXXL;
      }

      if (size === 0) {
        isAvailable = 0;
      }
      if (x.count>size) {
        stoploop=false
        req.flash("error", ` stock and requirement didnt meet`);
      return res.redirect("/cart");
      }
        x.bestOfferPrice=offerPrice

        totalOfferPrice +=offerPrice * x.count;
     
        totalPrice += x.product.mrp * x.count;
    });
    if (!stoploop) {
      return
    }
    if (isAvailable == 0) {
      req.flash("error", `  product out of stock. Please update your cart.`);
      return res.redirect("/cart"); 
    }
  
    let discount = totalPrice - totalOfferPrice;
    totalOfferPrice = totalOfferPrice + delivery;

    return res.render("checkout", {
      cart,
      totalPrice,
      totalOfferPrice,
      discount,
      addresses,
      wallet,
      delivery,    
    });
  } catch (error) {
    console.log(error);
  }
};

const checkOutLoadEditAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    res.render("checkOutEditAddress", { address });
  } catch (error) {
    console.log(error);
  }
};

const checkOutEditAddress = async (req, res) => {
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
    res.redirect("/checkOut");
  } catch (error) {
    console.log(error);
  }
};

const chekOutDeleteAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.id);

    req.flash("success", "successfully deleted");
    res.redirect("/checkOut");
  } catch (error) {
    console.log(error);
  }
};

const checkOutLoadAddAddress = async (req, res) => {
  try {
    res.render("checkOutAddAddress");
  } catch (error) {
    console.log(error);
  }
};

const checkOutAddAddress = async (req, res) => {
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
      res.redirect("/checkOut");
    }
  } catch (error) {
    console.log(error);
  }
};

const placeOrder = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    const selectedAddress = await Address.findById(req.params.addressId);
    const cartItems = await Cart.find({ user: user._id }).populate("product");
// for check the quantity is available or not 


for (const item of cartItems) {
  const { product, count, size } = item;

  
  let availableStock;
  if (size === "S") availableStock = product.stockS;
  else if (size === "M") availableStock = product.stockM;
  else if (size === "L") availableStock = product.stockL;
  else if (size === "XL") availableStock = product.stockXL;
  else if (size === "XXL") availableStock = product.stockXXL;

  
  if (availableStock < count) {
    req.flash(
      "error",
      `Product ${product.name} in size ${size} has insufficient stock.`
    );
    return res.redirect("/cart"); 
  }
}




    let deliveryCharge = 40;
    // for calculating the total price ,total offer to find discount
    let totalOfferPrice = 0;
    let totalPrice = 0;
    const orderProducts = [];
    let offerDiscount = 0;
    let totalMrp = 0;
    //to find the best offerprices
    const offerPromises = cartItems.map((item) => bestOfferPrice(item.product._id));
    const offerPrices = await Promise.all(offerPromises);
    cartItems.forEach((item,index) => {
      const { offerPrice } = offerPrices[index];
      const { product, count, size, quantity } = item;
      let applicablePrice = product.mrp; // Default to MRP
      totalMrp += product.mrp * count;
      
        
        applicablePrice = offerPrice; 
        offerDiscount += (product.mrp - offerPrice) * count;
    

      totalOfferPrice += applicablePrice * count;
      totalPrice += product.mrp * count;

      const productData = {
        productId: product._id,
        name: product.name,
        mrp: product.mrp,
        offerPrice: offerPrice,
        quantity: count,
        total: applicablePrice * count,
        size: size,
      };

      orderProducts.push(productData);
    });

    const discount = totalPrice - totalOfferPrice;
    let orderTotal = totalOfferPrice;
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, ""); // Current date in YYYYMMDDHHMMSS format
    const randomNum = Math.floor(1000 + Math.random() * 9000); // random 4 digit number
    const orderId = timestamp + randomNum;

    //when coupon is applied calculations according to it
    let couponCode = req.params.couponCode;
    //if no coupon code is applied the params is passed with null string on coupon code
    if (couponCode == "null") {
      couponCode = null;
    }
    const coupon = await Coupon.findOne({ code: couponCode });
    orderTotal = deliveryCharge + orderTotal;

    let couponDiscount = 0;
    if (coupon) {
      couponDiscount = Math.round((coupon.discount / 100) * orderTotal);

      if (couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
      orderTotal = orderTotal - couponDiscount;
    }
    // payment status
    let paymentStatus = "pending";
    let paymentId = "cash on delivery";
    // for redirect for payment
    if (req.params.paymentMethod == "paypal" && orderTotal > 0) {
      req.session.placeOrder = {
        addressId: req.params.addressId,
        paymentMethod: req.params.paymentMethod,
        couponCode: req.params.couponCode,
        orderTotal: orderTotal,
      };
      return res.redirect("/paypal");
    }
    let paymentMethod = "COD";
    // for getting manipulations after payment
    if (req.params.paymentMethod == "PAYPAL") {
      paymentId = req.query.paymentId;
      paymentStatus = "completed";
      paymentMethod = "PAYPAL";
    }

    //for failed payments

    if (req.params.paymentMethod == "PAYPALFAILED") {
      paymentId = req.query.paymentId;
      paymentStatus = "failed";
      paymentMethod = "PAYPAL";
    }

    if (req.params.paymentMethod == "WALLET") {
      const walletdata = await Wallet.findOne({ user: req.session.user_id });
      if (orderTotal > walletdata.balance) {
        req.flash("error", "Insufficient balance in your wallet.");
        return res.redirect(`/Checkout`);
      }
      paymentId = `${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8)}`;
      paymentStatus = "completed";
      paymentMethod = "WALLET";

      const wallet = await Wallet.findOneAndUpdate(
        { user: user },
        {
          $push: {
            transaction: {
              amount: -orderTotal, // Update the balance
              date: new Date(),
              transactionMode: "Payment done through Wallet",
            },
          },
          $inc: {
            balance: -orderTotal, // Update the balance
          },
        }
      );
    }

    //to make the count in cart to one default
    // await Cart.updateMany(
    //   { user: req.session.user_id },
    //   { $set: { count: 1 } }
    // );

    const newOrder = new Order({
      orderId: orderId,
      user: req.session.user_id,
      userName: user.name,
      email: user.email,
      shippingAddress: {
        street: selectedAddress.street,
        houseName: selectedAddress.houseName,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        district: selectedAddress.district,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        mobile: selectedAddress.mobile,
        altMobile: selectedAddress.altMobile,
        addressType: selectedAddress.addressType,
      },
      products: orderProducts,
      orderTotal: orderTotal,
      appliedCoupon: couponCode,
      couponDiscount: couponDiscount,
      paymentMethod: paymentMethod,
      paymentId: paymentId,
      paymentStatus: paymentStatus,
      offerDiscount: offerDiscount,
      totalMrp: totalMrp,
      deliveryCharge: deliveryCharge,
    });

    await newOrder.save();

    for (let item of cartItems) {
      const product = await Product.findById(item.product._id);
      const cart = await Cart.findOne({
        user: req.session.user_id,
        product: item.product._id,
      });
      if (item.size == "M") {
        product.stockM -= item.count;
        await product.save();
      } else if (item.size == "S") {
        product.stockS -= item.count;
        await product.save();
      } else if (item.size == "L") {
        product.stockL -= item.count;
        await product.save();
      } else if (item.size == "XL") {
        product.stockXL -= item.count;
        await product.save();
      } else if (item.size == "XXL") {
        product.stockXXL -= item.count;
        await product.save();
      }
    }
    // res.redirect(`/paypal`)

    res.redirect(`/orderSuccess/${orderId}`);
  } catch (error) {
    console.log(error);
  }
};

const orderSuccess = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).populate(
      "products.productId"
    );
    res.render("orderSuccess", { order });
  } catch (error) {
    console.log(error);
  }
};

//  for buying single products or buy option for every products without cart
const singleProductCheckout = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.session.user_id });
    const product = await Product.findById(req.params.productId);
    const wallet = await Wallet.findOne({ user: req.session.user_id });
  
    const { offerPrice, bestDiscount } = await bestOfferPrice(product._id);
    product.bestOfferPrice=offerPrice
    let quantity;
    if (req.params.size == "M") {
      quantity = product.stockM;
    } else if (req.params.size == "S") {
      quantity = product.stockS;
    } else if (req.params.size == "L") {
      quantity = product.stockL;
    } else if (req.params.size == "XL") {
      quantity = product.stockXL;
    } else if (req.params.size == "XXL") {
      quantity = product.stockXXL;
    }
    res.render("singleProductCheckout", {
      product,
      addresses,
      size: req.params.size,
      quantity,
      wallet,
    });
  } catch (error) {
    console.log(error);
  }
};

const singleProductOrder = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    const selectedAddress = await Address.findById(req.params.addressId);
    const product = await Product.findById(req.params.productId);

   
// to check again the product is awailable or not
if (req.params.size == "M") {
  quantity = product.stockM;
} else if (req.params.size == "S") {
  quantity = product.stockS;
} else if (req.params.size == "L") {
  quantity = product.stockL;
} else if (req.params.size == "XL") {
  quantity = product.stockXL;
} else if (req.params.size == "XXL") {
  quantity = product.stockXXL;
} 
if (quantity<req.params.count) {
  req.flash('error','quantity not available')
 return  res.redirect(`/singleProductCheckout/${product._id}/${req.params.size}`)
}
 

    const deliveryCharge = 40;
    // const cartItems = await Cart.find({ user: user._id }).populate('product');
    const count = req.params.count;
    const { offerPrice, bestDiscount } = await bestOfferPrice(product._id);

    // for calculating the total price ,total offer to find discount
    let totalOfferPrice = 0;
    let totalPrice = 0;
    const orderProducts = [];
    let size = req.params.size;
    let discount = 0;
    let offerDiscount = 0;
    let applicablePrice = product.mrp;
    let totalMrp = product.mrp * count;
   
      applicablePrice =offerPrice;
      offerDiscount = (product.mrp - offerPrice) * count;
   

    // Update total offer price and discount calculation
    totalOfferPrice = applicablePrice * count;
    discount = totalPrice - totalOfferPrice;

    const productData = {
      productId: product._id,
      name: product.name,
      mrp: product.mrp,
      offerPrice: offerPrice,
      quantity: count,
      total: applicablePrice * count,
      size: req.params.size,
    };

    orderProducts.push(productData);

    // const discount = totalPrice - totalOfferPrice;
    let orderTotal = totalOfferPrice;
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, ""); // Current date in YYYYMMDDHHMMSS format
    const randomNum = Math.floor(1000 + Math.random() * 9000); // random 4 digit number
    const orderId = timestamp + randomNum;

    //when coupon is applied calculations according to it
    let couponCode = req.params.couponCode;
    //if no coupon code is applied the params is passed with null string on coupon code
    if (couponCode == "null") {
      couponCode = null;
    }
    const coupon = await Coupon.findOne({ code: couponCode });
    orderTotal = deliveryCharge + orderTotal;

    let couponDiscount = 0;
    if (coupon) {
      couponDiscount = Math.round((coupon.discount / 100) * orderTotal);

      if (couponDiscount > coupon.maxDiscount) {
        couponDiscount = coupon.maxDiscount;
      }
      orderTotal = orderTotal - couponDiscount;
    }

    // payment methord paypal ----------
    if (req.params.paymentMethod == "paypal" && orderTotal > 0) {
      req.session.placeOrder = {
        addressId: req.params.addressId,
        productId: req.params.productId,
        count: req.params.count,
        // paymentMethod:req.params.paymentMethod,
        couponCode: req.params.couponCode,
        orderTotal: orderTotal,
        size: req.params.size,
      };

      return res.redirect("/buyNowPaypal");
    }
    let paymentStatus = "pending";

    let paymentMethod = "COD";
    let paymentId = `${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8)}`;
    // for getting manipulations after payment
    if (req.params.paymentMethod == "PAYPAL") {
      paymentId = req.query.paymentId;
      paymentStatus = "completed";
      paymentMethod = "PAYPAL";
    }
    if (req.params.paymentMethod == "PAYPALFAILED") {
      paymentId = req.query.paymentId;
      paymentStatus = "failed";
      paymentMethod = "PAYPAL";
    }

    // if the payment methord is wallet
    if (req.params.paymentMethod == "WALLET") {
      const walletdata = await Wallet.findOne({ user: req.session.user_id });
      if (orderTotal > walletdata.balance) {
        req.flash("error", "Insufficient balance in your wallet.");
        return res.redirect(
          `/singleProductCheckout/${req.params.productId}/${req.params.size}`
        );
      }
      paymentId = `${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8)}`;
      paymentStatus = "completed";
      paymentMethod = "WALLET";

      const wallet = await Wallet.findOneAndUpdate(
        { user: user },
        {
          $push: {
            transaction: {
              amount: -orderTotal, // Update the balance
              date: new Date(),
              transactionMode: "Payment done through Wallet",
            },
          },
          $inc: {
            balance: -orderTotal, // Update the balance
          },
        }
      );
    }
    const newOrder = new Order({
      orderId: orderId,
      user: req.session.user_id,
      userName: user.name,
      email: user.email,
      shippingAddress: {
        street: selectedAddress.street,
        houseName: selectedAddress.houseName,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        district: selectedAddress.district,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        mobile: selectedAddress.mobile,
        altMobile: selectedAddress.altMobile,
        addressType: selectedAddress.addressType,
      },
      products: orderProducts,
      orderTotal: orderTotal,
      appliedCoupon: couponCode,
      couponDiscount: couponDiscount,
      offerDiscount: offerDiscount,
      paymentId: paymentId,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      deliveryCharge: deliveryCharge,
      totalMrp: totalMrp,
    });

    await newOrder.save();

    const cart = await Cart.findOne({
      user: req.session.user_id,
      product: product._id,
    });

    if (size == "M") {
      product.stockM -= count;
      await product.save();
    } else if (size == "S") {
      product.stockS -= count;
      await product.save();
    } else if (size == "L") {
      product.stockL -= count;
      await product.save();
    } else if (size == "XL") {
      product.stockXL -= count;
      await product.save();
    } else if (size == "XXL") {
      product.stockXXL -= count;
      await product.save();
    }
    res.redirect(`/orderSuccess/${orderId}`);
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutLoadEditAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    const product = await Product.findById(req.params.productId);

    res.render("singleCheckOutEditAddress", {
      address,
      product,
      size: req.params.size,
    });
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutEditAddress = async (req, res) => {
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
    res.redirect(
      `/singleProductCheckOut/${req.params.productId}/${req.params.size}`
    );
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutLoadAddAddress = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    console.log(req.params.size);

    res.render("singleCheckOutAddAddress", { product, size: req.params.size });
  } catch (error) {
    console.log(error);
  }
};

const singleCheckOutAddAddress = async (req, res) => {
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
      res.redirect(
        `/singleProductCheckOut/${req.params.productId}/${req.params.size}`
      );
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  home,
  productLoad,
  review,
  loadShop,
  productZoom,
  checkOut,
  checkOutEditAddress,
  checkOutLoadEditAddress,
  chekOutDeleteAddress,
  checkOutLoadAddAddress,
  checkOutAddAddress,
  placeOrder,
  orderSuccess,
  singleProductCheckout,
  singleProductOrder,
  singleCheckOutLoadEditAddress,
  singleCheckOutEditAddress,
  singleCheckOutLoadAddAddress,
  singleCheckOutAddAddress,
};
