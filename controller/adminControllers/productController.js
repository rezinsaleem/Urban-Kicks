
const path = require('path')
const fs = require('fs')
const productCollection = require("../../model/productModel")
const categoryCollection = require('../../model/categoryModel')
const subcategoryCollection = require('../../model/subcatModel')


const LoadProducts = async (req, res) => {

  try {
    const product = await productCollection.find().populate({
      path: 'category',
      select: 'name'
    }).populate({
      path:'sub_category',
      select:'name'
    })
    res.render('admin/products', { product })
  } catch (err) {
    console.log(err)
    res.render('user/servererror')
  }
}

const LoadAddProduct = async (req, res) => {
  try {
    const categories = await categoryCollection.find({});
    res.render('admin/addProduct', { category: categories });
  } catch (err) {
    console.log(err);
    res.render('user/servererror');
  }
};

const fetchSubcat = async (req, res) => {
  const categoryId = req.query.categoryId;
  try {
      const subcategories = await subcategoryCollection.find({ p_category: categoryId });
      res.json(subcategories);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching subcategories" });
  }
};

const addProduct = async (req, res) => {
  try {
  
    const product = new productCollection({
      name: req.body.name,
      category: req.body.parentCategory,
      sub_category:req.body.subCategory,
      description: req.body.description,
      price: req.body.price,
      stock: [{
        size: "6",
        quantity: req.body.size6,
    },
    {
        size: "7",
        quantity: req.body.size7,
    },
    {
        size: "8",
        quantity: req.body.size8,
    },
    {
        size: "9",
        quantity: req.body.size9,
    },
    ],
      image: req.files.map(file => file.path),
    })
    await product.save()

    res.redirect('/admin/products')
  } catch (error) {
    console.log(error);
    res.render("user/servererror");
  }
}

const unlistProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await productCollection.findById(id);
    product.status = !product.status;
    await product.save();
    res.redirect('/admin/products')
  } catch (err) {
    console.log(err);
    res.render("user/servererror");
  }
}

const LoadUpdateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await productCollection.findById(id);
    res.render('admin/updateproduct', { product })
  } catch (err) {
    console.log(err)
    res.render('user/servererror')
  }
}

const updateProduct = async (req, res) => {
  try {
    
    const id = req.params.id;
    const product = await productCollection.findById(id)
    product.name = req.body.name
    product.description = req.body.description
    product.price = req.body.price
    product.stock = [
      { size: '6', quantity: req.body.size6 },
      { size: '7', quantity: req.body.size7 },
      { size: '8', quantity: req.body.size8 },
      { size: '9', quantity: req.body.size9 }
  ];
    await product.save();
    res.redirect('/admin/products')
  } catch (error) {
    console.log(error);
    res.render("user/servererror");
  }
}

const LoadEditImage = async (req, res) => {
  try {
    const errorMessages = req.flash('error');
    const id = req.params.id;
    const product = await productCollection.findById(id)
    res.render('admin/editImage', { product , errorMessages})
  } catch (error) {
    console.log(error);
    res.render('user/servererror')
  }
}

const updateImage = async (req, res) => {
  try{
       const id = req.params.id;
       const product = await productCollection.findById(id)
        const newimg = req.files.map(file => file.path)
        product.image.push(...newimg)
        product.save()
        res.redirect('/admin/updateproduct/' + id)
    } catch (err) {
        console.log(err);
        res.render("user/servererror")
    }
}


const deleteImage = async (req, res) => {
  try {
      const pid = req.query.pid;
      const filename = req.query.filename;
      const imagePath = path.join("uploads", filename);

      if (fs.existsSync(filename)) {
          try {
              fs.unlinkSync(filename);
              console.log("Image deleted");
              req.flash('error',"Image deleted!")
              res.redirect("/admin/editImage/" + pid);

              await productCollection.updateOne(
                  { _id: pid },
                  { $pull: { image: filename } }
              );
          } catch (err) {
              console.log("error deleting image:", err);
              res.status(500).send("Internal Server Error");
          }
      } else {
          console.log("Image not found");
          req.flash("error","Image not found!")
          res.redirect("/admin/editImage/" + pid);
      }
  } catch (err) {
      console.log(err);
      res.render("user/serverError")
  }
};


module.exports = {
  LoadProducts,
  LoadAddProduct,
  addProduct,
  unlistProduct,
  LoadUpdateProduct,
  updateProduct,
  LoadEditImage,
  updateImage,
  deleteImage,
  fetchSubcat,
}