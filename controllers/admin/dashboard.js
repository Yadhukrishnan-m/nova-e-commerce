const User = require("../../models/usermodel");
const Admin = require("../../models/adminmodel");
const Category = require("../../models/category");
const Product = require("../../models/product");
const Address = require("../../models/address");
const Order = require("../../models/order");
const Wallet = require("../../models/wallet");
const PDFDocument = require("pdfkit");
const xlsx = require("xlsx");
const fs = require("fs");

async function bestSellingProducts() {
  try {
    return await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalQuantitySold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 1,
          totalQuantitySold: 1,
          productDetails: { $arrayElemAt: ["$productDetails.name", 0] },
        },
      },
    ]);
  } catch (error) {
    console.log(error);
  }
}

async function bestSellingCategory() {
  try {
    return Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalQuantitySold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      {
        $lookup: {
          from: "category",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $project: {
          categoryName: { $arrayElemAt: ["$categoryDetails.name", 0] },
          totalQuantitySold: 1,
        },
      },
    ]);
  } catch (error) {
    console.log(error);
  }
}

// to load the dashboard
const loadDashboard = async (req, res) => {
  try {
    let overallSales = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSalesCount: { $sum: 1 }, // Count total number of sales
          totalDiscount: {
            $sum: {
              $add: ["$couponDiscount", "$offerDiscount"],
            },
          },
          totalOrderAmount: { $sum: "$orderTotal" },
        },
      },
    ]);

    if (overallSales.length == 0) {
      (overallSales.totalSalesCount = 0),
        (overallSales.totalDiscount = 0),
        (overallSales.totalOrderAmount = 0);
    } else {
      overallSales = overallSales[0];
    }

    const bestProducts = await bestSellingProducts();
    const bestCategory = await bestSellingCategory();

    res.render("dashboard", { overallSales, bestProducts, bestCategory });
  } catch (error) {
    console.log(error);
  }
};

const loadSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 0);
    const salesData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
        },
      },

      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$orderTotal" },
          discount: { $sum: { $add: ["$couponDiscount", "$offerDiscount"] } },
          couponDiscount: { $sum: "$couponDiscount" },
          offerDiscount: { $sum: "$offerDiscount" },
          mrp: { $sum: "$totalMrp" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    let totalOrder = 0;
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCouponDiscount = 0;
    let totalOfferDiscount = 0;
    let totalMrp = 0;

    if (salesData.length > 0) {
      salesData.forEach((element) => {
        totalOrder += element.orders;
        totalRevenue += element.revenue;
        totalDiscount += element.discount;
        totalCouponDiscount += element.couponDiscount;
        totalOfferDiscount += element.offerDiscount;
        totalMrp += element.mrp;
      });
    }

    res.render("salesReport", {
      salesData,
      startDate,
      endDate,
      totalOrder,
      totalRevenue,
      totalDiscount,
      totalCouponDiscount,
      totalOfferDiscount,
      totalMrp,
    });
  } catch (error) {
    console.log(error);
  }
};

const downloadPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 0);

    const salesData = await Order.aggregate([
      {
        $match: { orderDate: { $gte: start, $lte: end } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$orderTotal" },
          discount: { $sum: { $add: ["$couponDiscount", "$offerDiscount"] } },
          couponDiscount: { $sum: "$couponDiscount" },
          offerDiscount: { $sum: "$offerDiscount" },
          mrp: { $sum: "$totalMrp" },
        },
      },
    ]);

    let totalOrder = 0;
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCouponDiscount = 0;
    let totalOfferDiscount = 0;
    let totalMrp = 0;

    if (salesData.length > 0) {
      salesData.forEach((element) => {
        totalOrder += element.orders;
        totalRevenue += element.revenue;
        totalDiscount += element.discount;
        totalCouponDiscount += element.couponDiscount;
        totalOfferDiscount += element.offerDiscount;
        totalMrp += element.mrp;
      });
    }

    // Calculate delivery charges
    const deliveryChargePerOrder = 40;
    const totalDeliveryCharges = totalOrder * deliveryChargePerOrder;

    const formatCurrency = (amount) => {
      return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };
    const doc = new PDFDocument();
    const filePath = `./salesReport_${startDate}_to_${endDate}.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Set the font
    doc.font("Times-Roman"); // Change to Times-Roman or any other font

    // Report Header
    doc.fontSize(24).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Start Date: ${startDate}`, { align: "left" });
    doc.text(`End Date: ${endDate}`, { align: "left" });
    doc.moveDown();

    // Total Summary
    doc.fontSize(14).text(`Total Orders: ${totalOrder}`);
    doc.text(`Total MRP: ${totalMrp}`);
    doc.text(`Total Discount: ${totalDiscount}`);
    doc.text(`Total Coupon Discount: ${totalCouponDiscount}`);
    doc.text(`Total Offer Discount: ${totalOfferDiscount}`);
    doc.text(`Total Delivery Charges: ${totalDeliveryCharges}`);
    doc.text(`Final Revenue: ${totalRevenue}`);
    doc.moveDown();

    // Detailed Sales Data
    doc.fontSize(18).text("DETAILS ON DAILY BASIS", { align: "center" });
    salesData.forEach((data) => {
      doc.moveDown(); // Space after heading
      doc.fontSize(12).text(`Date: ${data._id}`);
      doc.text(`Orders: ${data.orders}`);
      doc.text(`Revenue: ${data.revenue}`);
      doc.text(`Discount: ${data.discount}`);

      doc.text(`Coupon Discount: ${data.couponDiscount}`);
      doc.text(`Offer Discount: ${data.offerDiscount}`);
      doc.text(`Delivery charge: ${data.orders * 40}`);

      doc.text(`MRP: ${data.mrp}`);
      doc.moveDown();
    });

    // Final Totals Section
    // doc.moveDown();
    // doc.fontSize(12).text('Final Totals', { underline: true });
    // doc.text(`totalOrder: ${totalOrder}`);

    // doc.text(`Total MRP: ${totalMrp}`);
    // doc.text(`Total Discounts: - ${totalDiscount}`);
    // doc.text(`Total Delivery Charges: ${totalDeliveryCharges}`);
    // doc.text(`Grand Total: ${totalRevenue + totalDeliveryCharges - totalDiscount}`);

    doc.end();
    writeStream.on("finish", () => {
      res.download(
        filePath,
        `salesReport_${startDate}_to_${endDate}.pdf`,
        (err) => {
          if (err) {
            console.error("Error sending file:", err);
          } else {
            console.log("File sent successfully.");

            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
              }
            });
          }
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
};

const downloadExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 0);

    const salesData = await Order.aggregate([
      {
        $match: { orderDate: { $gte: start, $lte: end } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$orderTotal" },
          discount: { $sum: { $add: ["$couponDiscount", "$offerDiscount"] } },
          couponDiscount: { $sum: "$couponDiscount" },
          offerDiscount: { $sum: "$offerDiscount" },
          mrp: { $sum: "$totalMrp" },
        },
      },
    ]);

    let totalOrder = 0;
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCouponDiscount = 0;
    let totalOfferDiscount = 0;
    let totalMrp = 0;

    if (salesData.length > 0) {
      salesData.forEach((element) => {
        totalOrder += element.orders;
        totalRevenue += element.revenue;
        totalDiscount += element.discount;
        totalCouponDiscount += element.couponDiscount;
        totalOfferDiscount += element.offerDiscount;
        totalMrp += element.mrp;
      });
    }

    const deliveryChargePerOrder = 40;

    // Create a new workbook and worksheet data
    const wb = xlsx.utils.book_new();
    const wsData = [
      ["Sales Report"], // Title
      [],
      ["Start Date", startDate], // Start and End Dates
      ["End Date", endDate],
      [],
      ["Total Orders", totalOrder],
      ["Total MRP", totalMrp],
      ["Total Discount", totalDiscount],
      ["Total Coupon Discount", totalCouponDiscount],
      ["Total Offer Discount", totalOfferDiscount],
      ["Total Delivery Charges", totalOrder * deliveryChargePerOrder],
      ["Final Revenue", totalRevenue],
      [],
      ["Detailed Sales Data"],
      [
        "Date",
        "Orders",
        "Revenue",
        "Discount",
        "Coupon Discount",
        "Offer Discount",
        "Delivery Charges",
        "MRP",
      ], // Headers for data, added Delivery Charges
    ];

    // Loop through salesData and add delivery charges per order
    salesData.forEach((data) => {
      const deliveryCharges = data.orders * deliveryChargePerOrder; // Calculate delivery charges per day
      wsData.push([
        data._id, // Date
        data.orders, // Orders
        data.revenue, // Revenue
        data.discount, // Discount
        data.couponDiscount ?? 0, // Handle undefined coupon discount
        data.offerDiscount ?? 0, // Handle undefined offer discount
        deliveryCharges, // Delivery charges
        data.mrp, // MRP
      ]);
    });

    // Convert the worksheet data to a sheet
    const ws = xlsx.utils.aoa_to_sheet(wsData);

    // Append the worksheet to the workbook
    xlsx.utils.book_append_sheet(wb, ws, "Sales Report");

    // Write the Excel file to the file system
    const filePath = `./salesReport_${startDate}_to_${endDate}.xlsx`;
    xlsx.writeFile(wb, filePath);
    res.download(
      filePath,
      `salesReport_${startDate}_to_${endDate}.xlsx`,
      (err) => {
        if (err) {
          console.error("Error sending file:", err);
        } else {
          console.log("File sent successfully.");

          fs.unlink(filePath, (unlinkErr) => {});
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

const chart = async (req, res) => {
  try {
    const filter = req.query.filter;

    let labels = [];
    let revenueData = [];
    let ordersData = [];

    if (filter === "yearly") {
      const orders = await Order.aggregate([
        {
          $group: {
            _id: { $year: "$orderDate" },
            totalRevenue: { $sum: "$orderTotal" },
            totalOrders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      labels = orders.map((order) => order._id.toString());
      revenueData = orders.map((order) => order.totalRevenue);
      ordersData = orders.map((order) => order.totalOrders);
    } else if (filter === "monthly") {
      const currentYear = new Date().getFullYear();

      labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      revenueData = new Array(12).fill(0);
      ordersData = new Array(12).fill(0);

      const orders = await Order.aggregate([
        {
          $match: {
            orderDate: {
              $gte: new Date(`${currentYear}-01-01`),
              $lt: new Date(`${currentYear + 1}-01-01`),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$orderDate" },
              month: { $month: "$orderDate" },
            },
            totalRevenue: { $sum: "$orderTotal" },
            totalOrders: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);

      orders.forEach((order) => {
        const monthIndex = order._id.month - 1;

        revenueData[monthIndex] = order.totalRevenue;
        ordersData[monthIndex] = order.totalOrders;
      });
    } else if (filter === "daily") {
      const today = new Date();
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(today.getDate() - 10);

      const orders = await Order.aggregate([
        {
          $match: {
            orderDate: {
              $gte: tenDaysAgo,
              $lt: today,
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            totalRevenue: { $sum: "$orderTotal" },
            totalOrders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      labels = [];
      revenueData = new Array(10).fill(0);
      ordersData = new Array(10).fill(0);

      for (let i = 9; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        labels.push(date.toISOString().split("T")[0]);
      }

      orders.forEach((order) => {
        const index = labels.indexOf(order._id);
        if (index !== -1) {
          revenueData[index] = order.totalRevenue;
          ordersData[index] = order.totalOrders;
        }
      });
    }

    res.json({ labels, revenue: revenueData, orders: ordersData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
};

module.exports = {
  loadDashboard,
  loadSalesReport,
  downloadPdf,
  downloadExcel,
  chart,
};
