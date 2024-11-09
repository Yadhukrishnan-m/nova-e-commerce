const Category = require("../../models/category");

// load category
const loadCategory = async (req, res) => {
  try {
    const categoryData = await Category.find();
    res.render("category", { categoryData });
  } catch (error) {
    console.log(error);
  }
};

const listCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    if (!category) {
      req.flash("errorMsg", "category not found");
      return res.redirect("/admin/category");
    }

    category.is_active = category.is_active === 1 ? 0 : 1;
    await category.save(); // Save the updated user

    req.flash("successMsg", `category status updated successfully`);
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
  }
};

const addCategory = async (req, res) => {
  try {
    const categoryName = req.body.categoryName.trim();
    const description = req.body.description;

    const category = new Category({
      name: categoryName,
      description: description,
    });

    const categoryData = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, "i") },
    });
    if (categoryData) {
      req.flash("errorMsg", "category alredy exist");
      res.redirect("/admin/category");
    } else {
      await category.save();
      console.log("category sucessfully saved");
      req.flash("successMsg", "category sucessfully added");
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error);
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const category_id = req.params.id;
    const category = await Category.findById(category_id);

    if (!category) {
      req.flash("errorMsg", "category not found");
      res.redirect("/admin/category");
    } else {
      res.render("categoryEdit", { category });
    }
  } catch (error) {
    console.log(error);
  }
};

const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categoryName = req.body.categoryName;
    const description = req.body.description;
    const category = await Category.findById(categoryId);

    if (!category) {
      req.flash("errorMsg", "category not found");
      return res.redirect("/admin/category");
    }

    //  update the category and save it
    category.name = categoryName;
    category.description = description;

    await category.save();
    req.flash("successMsg", "sucessfully edited ");

    return res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadCategory,
  addCategory,
  listCategory,
  loadEditCategory,
  editCategory,
};
