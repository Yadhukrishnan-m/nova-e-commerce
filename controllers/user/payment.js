const paypal = require("paypal-rest-sdk");

const PDFDocument = require("pdfkit");
const fs = require("fs");

const Order = require("../../models/order");
const convertCurrency = require("../../services/currencyConverter");

paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_KEY,
});

const payProduct = async (req, res) => {
  try {
    const orderDetails = req.session.placeOrder;
    let total = await convertCurrency(orderDetails.orderTotal, "INR", "USD");

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `http://${process.env.domainUrl}/paymentsuccess`,
        cancel_url: `http://${process.env.domainUrl}/paymentcancel`,
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
  const orderDetails = req.session.placeOrder;
  const paymentMethod = "PAYPAL";
  req.session.placeOrder = null;

  let total = await convertCurrency(orderDetails.orderTotal, "INR", "USD");

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
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        res.redirect(
          `/placeOrder/${orderDetails.addressId}/${orderDetails.couponCode}/${paymentMethod}?paymentId=${paymentId} `
        );
      }
    }
  );
};

const cancel = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const orderDetails = req.session.placeOrder;
    const paymentMethod = "PAYPALFAILED";
    req.session.placeOrder = null;

    res.redirect(
      `/placeOrder/${orderDetails.addressId}/${orderDetails.couponCode}/${paymentMethod}?paymentId=${paymentId} `
    );
  } catch (error) {
    console.log(error);
  }
};

// section dor buy now payments

const buyNowPayProduct = async (req, res) => {
  try {
    const orderDetails = req.session.placeOrder;
    let total = await convertCurrency(orderDetails.orderTotal, "INR", "USD");

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `http://${process.env.domainUrl}/buyNowPaymentsuccess`,
        cancel_url: `http://${process.env.domainUrl}/buyNowPaymentcancel`,
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

const buyNowSuccess = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const orderDetails = req.session.placeOrder;
  const paymentMethod = "PAYPAL";
  req.session.placeOrder = null;

  let total = await convertCurrency(orderDetails.orderTotal, "INR", "USD");

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
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        res.redirect(
          `/singleProductOrder/${orderDetails.productId}/${orderDetails.count}/${orderDetails.addressId}/${orderDetails.size}/${orderDetails.couponCode}/${paymentMethod}?paymentId=${paymentId} `
        );
      }
    }
  );
};

const buyNowCancel = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const orderDetails = req.session.placeOrder;
    const paymentMethod = "PAYPALFAILED";
    req.session.placeOrder = null;

    res.redirect(
      `/singleProductOrder/${orderDetails.productId}/${orderDetails.count}/${orderDetails.addressId}/${orderDetails.size}/${orderDetails.couponCode}/${paymentMethod}?paymentId=${paymentId} `
    );
  } catch (error) {
    console.log(error);
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate("products.productId");

    const doc = new PDFDocument();
    const filePath = `./NOVA_invoice_${order._id}.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const pageWidth = doc.page.width;
    const leftMargin = 50;
    const rightMargin = pageWidth - 50;
    const contentWidth = rightMargin - leftMargin;

    // Helper functions
    const centeredText = (text, y, options = {}) => {
      const textWidth = doc.widthOfString(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y, options);
    };

    const rightAlignedText = (text, x, y, width, options = {}) => {
      const textWidth = doc.widthOfString(text);
      const positionX = x + width - textWidth;
      doc.text(text, positionX, y, options);
    };

    // const formatCurrency = (amount) => `${amount.toFixed(2)}`;
    const formatCurrency = (amount) => {
      if (typeof amount !== "number" || isNaN(amount)) {
        return "0.00"; // Return a default value if the amount is not a valid number
      }
      return `${amount.toFixed(2)}`;
    };

    // Title
    doc.font("Helvetica-Bold").fontSize(24);
    centeredText("INVOICE", 50, { underline: true });

    // Order Details
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Order Details", leftMargin, 100);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Order ID: ${order.orderId}`, leftMargin, 120);
    doc.text(
      `Order Date: ${new Date(order.orderDate).toLocaleDateString("en-IN")}`,
      leftMargin,
      135
    );
    doc.text(`Payment Method: ${order.paymentMethod}`, leftMargin, 150);
    doc.text(`Payment Status: ${order.paymentStatus}`, leftMargin, 165);

    // Customer Details
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Customer Details", leftMargin, 200);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Customer: ${order.userName}`, leftMargin, 220);
    doc.text(`Email: ${order.email}`, leftMargin, 235);

    // Shipping Address
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Shipping Address", leftMargin, 270); // Adjusted position
    doc.font("Helvetica").fontSize(10);
    doc.text(order.shippingAddress.houseName, leftMargin, 290);
    doc.text(order.shippingAddress.street, leftMargin, 305);
    doc.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`,
      leftMargin,
      320
    );
    doc.text(order.shippingAddress.mobile, leftMargin, 335);

    // Product Details Table
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Product Details", leftMargin, 380);

    // Table Header
    const tableTop = 400;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Product Name", leftMargin, tableTop);
    doc.text("Size", leftMargin + 220, tableTop);
    doc.text("Qty", leftMargin + 270, tableTop);
    rightAlignedText("Price", leftMargin + 320, tableTop, 70);
    rightAlignedText("Total", leftMargin + 400, tableTop, 70);

    // Product rows
    doc.font("Helvetica").fontSize(10);
    let yPosition = tableTop + 20;
    order.products.forEach((product) => {
      doc.text(product.name, leftMargin, yPosition, { width: 200 });
      doc.text(product.size, leftMargin + 220, yPosition); // Adjusted for better alignment
      doc.text(product.quantity.toString(), leftMargin + 270, yPosition); // Adjusted for alignment
      rightAlignedText(
        formatCurrency(product.offerPrice),
        leftMargin + 320,
        yPosition,
        70
      ); // Fixed price position
      rightAlignedText(
        formatCurrency(product.total),
        leftMargin + 400,
        yPosition,
        70
      ); // Fixed total position
      yPosition += 20;
    });

    // Discount Summary
    yPosition += 20;
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Discount Summary", leftMargin, yPosition);
    doc.font("Helvetica").fontSize(10);
    yPosition += 20;
    if(order.appliedCoupon){
    doc.text(`Coupon Discount:  ${order.appliedCoupon}`, leftMargin, yPosition);
    rightAlignedText(
      formatCurrency(order.couponDiscount),
      leftMargin + 400,
      yPosition,
      70
    ); 
    }// Fixed discount position
    yPosition += 15;
    doc.text("Offer Discount:", leftMargin, yPosition);
    rightAlignedText(
      formatCurrency(order.offerDiscount),
      leftMargin + 400,
      yPosition,
      70
    ); // Fixed discount position

    // Final Totals
    yPosition += 30;
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Final Totals", leftMargin, yPosition);
    doc.font("Helvetica").fontSize(10);
    yPosition += 20;
    doc.text("Total MRP:", leftMargin, yPosition);
    rightAlignedText(
      formatCurrency(order.totalMrp),
      leftMargin + 400,
      yPosition,
      70
    ); // Fixed MRP position
    yPosition += 15;
    doc.text("Total Discounts:", leftMargin, yPosition);
    rightAlignedText(
      `- ${formatCurrency(order.couponDiscount + order.offerDiscount)}`,
      leftMargin + 400,
      yPosition,
      70
    ); // Fixed discount position
    yPosition += 15;
    doc.text("Delivery Charges", leftMargin, yPosition);
    rightAlignedText(
      ` ${formatCurrency(order.deliveryCharge)}`,
      leftMargin + 400,
      yPosition,
      70
    ); // Fixed discount position
    yPosition += 15;
    doc.font("Helvetica-Bold");
    doc.text("Order Total:", leftMargin, yPosition);
    rightAlignedText(
      formatCurrency(order.orderTotal),
      leftMargin + 400,
      yPosition,
      70
    ); // Fixed total position

    // Footer

    doc.end();
    writeStream.on("finish", () => {
      res.download(filePath, `./NOVA_invoice_${order._id}.pdf`, (err) => {
        if (err) {
          console.error("Error sending file:", err);
        } else {
          console.log("File sent successfully.");

          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
            }
          });
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const paymentRetry = async (req, res) => {
  try {
    const orderDetails = await Order.findOne({ orderId: req.params.orderId });

    let total = await convertCurrency(orderDetails.orderTotal, "INR", "USD");

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `http://${process.env.domainUrl}/retryPaymentSuccess/${orderDetails.orderId}`,
        cancel_url: `http://${process.env.domainUrl}/retryPaymentCancel/${orderDetails.orderId}`,
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

const retrySuccess = async (req, res) => {
  try {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    let orderDetails = await Order.findOne({ orderId: req.params.orderId });

    let total = await convertCurrency(orderDetails.orderTotal, "INR", "USD");

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
          orderDetails = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            { paymentStatus: "completed", paymentId: paymentId }
          );

          req.flash("success", "payment Successfull");

          res.redirect(`/orderDetails/${req.params.orderId}`);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

const retryCancel = async (req, res) => {
  try {
    const orderDetails = await Order.findOne({ orderId: req.params.orderId });

    req.flash("error", "payment again failed");
    res.redirect(`/orderDetails/${orderDetails.orderId}`);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  payProduct,
  success,
  cancel,
  buyNowPayProduct,
  buyNowSuccess,
  buyNowCancel,
  downloadInvoice,
  paymentRetry,
  retryCancel,
  retrySuccess,
};
