
const productCollection = require('../../model/productModel')
const categoryCollection = require('../../model/categoryModel')
const subcatCollection = require('../../model/subcatModel')
const wishlistCollection  = require('../../model/wishlistModel')

const LoadShop = async (req, res) => {
  try {
      
      const categories = await categoryCollection.find({status:true}).limit(3)
      const categoryId = req.params.id;
      const currentPage = categoryId;
      const category = await categoryCollection.findById(categoryId)
      const products = await productCollection.find({ status: true, category: categoryId })
      const subcategories = await subcatCollection.find({ p_category: categoryId, status: true}).populate('p_category');
      res.render('user/shop', {  subcategories, products ,category ,categories,currentPage});
  } catch (error) {
      console.log(error.message);
      res.render('user/servererror');
  }
};



const shopSingle = async (req, res) => {
  try {
      const categories = await categoryCollection.find({status:true}).limit(3)
      const productId = req.params.id;
      const product = await productCollection.findById(productId); 
      let pass;
      if (product.totalstock == 0) {
          pass = 'Out of Stock'
      }
      res.render('user/product-detail',{product,categories,pass});
  } catch (error) {
      console.log(error);
      res.render('user/servererror');
  }
}

const addToWish = async (req, res) => {
  try {
    const size = req.query.size;
    const pid = req.params.id;
    const userId = req.session.userId;
    
    let wishlist = await wishlistCollection.findOne({ userId: userId });

    if (!wishlist) {
      wishlist = new wishlistCollection({
        userId: userId,
        item: [{ productId: pid, size: size }]
      });
    } else {
      const existingProductIndex = wishlist.item.findIndex(item => item.productId.toString() === pid);
      if (existingProductIndex === -1) {
        wishlist.item.push({ productId: pid, size: size });
      } else {
        wishlist.item[existingProductIndex].size = size;
      }
    }

    await wishlist.save();
    res.redirect('/wishlist');
  } catch (error) {
    console.log(error);
    res.render('user/servererror');
  }
};



const LoadWishlist = async (req, res) => {
  try {
      const currentPage='wishlist'
      const userId = req.session.userId
      const categories = await categoryCollection.find({status:true}).limit(3)
      const fav = await wishlistCollection.findOne({ userId: userId }).populate({
          path: 'item.productId',
          select: "_id name description image"
      })
      res.render('user/wishlist', {title:"Urbankicks - Wishlist", fav: fav, categories ,currentPage})
  } catch (error) {
      console.log(error);
      res.render('user/servererror');
  }
}

const removewishlist = async (req, res) => {
  try {
      const userId = req.session.userId;
      const productIdToRemove = req.params.id;
      const result = await wishlistCollection.updateOne(
          { userId: userId },
          { $pull: { item: { productId: productIdToRemove } } }
      );

      res.redirect('/wishlist')
  } catch (error) {
      console.log(error);
      res.render('user/servererror');
  }
}

module.exports = {
  shopSingle,
  LoadShop,
  addToWish,
  LoadWishlist,
  removewishlist,
}

