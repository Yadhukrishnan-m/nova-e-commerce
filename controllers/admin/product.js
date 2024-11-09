const path = require("path");
const fs = require("fs");

const Category = require("../../models/category");
const Product = require("../../models/product");
const Cart = require("../../models/cart");
const Wishlist = require("../../models/wishlist");

const loadProduct = async (req, res) => {
  try {
    const products = await Product.find().populate("category");

    res.render("product", { products });
  } catch (error) {
    console.log(error);
  }
};

const listProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      req.flash("errorMsg", "product not found");
      return res.redirect("/admin/product");
    }

    product.is_active = product.is_active === 1 ? 0 : 1;
    await product.save(); // Save the updated user

    if (product.is_active === 0) {
      await Cart.deleteMany({ product: productId });
      await Wishlist.deleteMany({ product: productId });
    }

    req.flash("successMsg", `product status updated successfully`);
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();

    res.render("addProduct", { categories });
  } catch (error) {
    console.log(error);
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      mrp,
      discount,
      stock_s,
      stock_m,
      stock_l,
      stock_xl,
      stock_xxl,
      specification,
    } = req.body;
    let stockS = stock_s,
      stockM = stock_m,
      stockL = stock_l,
      stockXL = stock_xl,
      stockXXL = stock_xxl;

    const image = req.files.map((file) => "/productImages/" + file.filename);

    const offerPrice = Math.floor(mrp - mrp * (discount / 100));

    const newProduct = new Product({
      name,
      description,
      category,
      mrp,
      offerPrice,
      stockS,
      stockM,
      stockL,
      stockXL,
      stockXXL,
      image,
      specification,
      discount,
      offerIsActive: true,
    });
    await newProduct.save();
    req.flash("successMsg", "Product added successfully");
    res.redirect("/admin/product");
  } catch (error) {
    console.log(error);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate("category");
    const categories = await Category.find();

    res.render("editProduct", { product, categories });
  } catch (error) {
    console.log(error);
  }
};

const editProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      mrp,
      discount,
      stock_s,
      stock_m,
      stock_l,
      stock_xl,
      stock_xxl,
      specification,
    } = req.body;
    const image = req.files.map((file) => "/productImages/" + file.filename);

    const product = await Product.findById(req.params.id);
    const offerPrice = Math.floor(mrp - mrp * (discount / 100));

    const oldImages = product.image;
    const publicPath = path.join(__dirname, "../public");

    // Get the images marked for removal
    const imagesToRemove = req.body.removeImages || []; // This will be an array of image paths

    // Remove the selected images from the `product.image` array
    const remainingImages = oldImages.filter(
      (img) => !imagesToRemove.includes(img)
    );

    // Delete the old images from the folder
    imagesToRemove.forEach((imgPath) => {
      const fullImagePath = path.join(publicPath, imgPath);
      if (fs.existsSync(fullImagePath)) {
        fs.unlinkSync(fullImagePath); // Delete the image file
      } else {
        console.log(`Image not found: ${fullImagePath}`);
      }
    });

    // Update the product details
    product.name = name;
    product.description = description;
    product.category = category;
    product.mrp = mrp;
    product.offerPrice = offerPrice;
    product.stockS = stock_s;
    product.stockM = stock_m;
    product.stockL = stock_l;
    product.stockXL = stock_xl;
    product.stockXXL = stock_xxl;
    product.specification = specification;

    // Combine remaining images with new ones, if any
    product.image = [...remainingImages, ...image];
    product.discount = discount;

    await product.save();

    req.flash("successMsg", "Successfully updated");
    return res.redirect("/admin/product");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/product");
  }
};

module.exports = {
  loadProduct,
  listProduct,
  loadAddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
};
