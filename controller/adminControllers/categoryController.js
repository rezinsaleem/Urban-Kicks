const subcatCollection = require('../../model/subcatModel');
const categoryCollection = require('../../model/categoryModel')
const productCollection = require('../../model/productModel')

const LoadCategory = async(req,res)=>{
try{
  const successMessage = req.flash('success');
  const category = await categoryCollection.find({});
  res.render('admin/categories',{category,successMessage})
}catch(error){
  console.log(error)
}
}

const LoadAddCategory = async(req,res)=>{
  try{
    const errorMessages = req.flash('error');
    res.render('admin/addCategory',{errorMessages})
  }catch(err){
    console.log(err)
  }
}

const addCategory = async(req,res)=>{
  try{
    const categoryName = req.body.name;
    const categoryDescription = req.body.description;
    const discount=req.body.discount;
    const categoryExist = await categoryCollection.findOne({ name: { $regex: new RegExp("^" + categoryName + "$", "i") } });

    if (categoryExist) {
      req.flash('error', 'Category Already Exists');
      return res.redirect('/admin/addcategory');
  } else {
      await categoryCollection.create({ name: categoryName, description: categoryDescription ,discount:discount});
      req.flash('success', 'Category Added Successfully!');
      res.redirect('/admin/categories');
  }
} catch (err) {
  console.log(err);
  res.render("user/servererror");
}
};

const LoadUpdateCategory = async(req,res)=>{
  try{
    const id = req.params.id;
    const category = await categoryCollection.findById(id);
    const catError=req.flash('catError');
    res.render('admin/updateCategory',{category,catError})
  }catch(err){
    console.log(err)
    res.render('user/servererror');
  }
}

const unlistCategory = async (req, res) => {
  try {
      const id = req.params.id;
      const category = await categoryCollection.findById(id);
      category.status = !category.status;
      await category.save();
      res.redirect('/admin/categories')
  } catch (err) {
      console.log(err);
      res.render("user/servererror");
  }
}

const updateCategory = async(req,res)=>{
  try{
    const id = req.params.id;
    const product=await productCollection.find({category:id})
    const category = await categoryCollection.findById(id);
    const catName = req.body.name;
    const isNameModified = catName !== category.name; 
    if (isNameModified) {
      const catExist = await categoryCollection.findOne({ name: { $regex: new RegExp("^" + catName + "$", "i") } });
      if (catExist) {
          req.flash('catError', 'Category Already Exists');
          return res.redirect('/admin/updateCategory/' + id);
      }
  }
    category.description = req.body.description;
    category.discount=req.body.discount;
    await category.save()
    const categoryDiscount=category.discount;
    product.forEach(async (element) => {
        if (categoryDiscount > element.discount) {
            element.discount = categoryDiscount;
        }
        element.discountPrice = element.price - (element.price * (element.discount / 100));
        await element.save();
    });
    res.redirect('/admin/categories');
  }catch(err){
    console.log(err)
    res.render('user/servererror')
  }
}


// ----------------------subcategory----------------



const LoadSubCategory = async(req,res)=>{
  try{
    const successMessage = req.flash('success');
    const subcategory = await subcatCollection.find({}).populate({
      path:'p_category',
      select:'name'
    });
    res.render('admin/subcategories',{subcategory,successMessage})
  }catch(err){
    console.log(err)
    res.render('user/servererror')
  }
}


const LoadAddSubCategory = async(req,res)=>{
  try {
    const errorMessages = req.flash('error');
    const pcategory = await categoryCollection.find()
    res.render('admin/addSubcategory',{pcategory , errorMessages})
  } catch (error) {
    console.log(error)
    res.render('user/servererror')
  }
}

const addSubcategory = async(req,res)=>{
  try {
    const categoryName  = req.body.name;
    const parentCategory = req.body.parentCategory;
    const description = req.body.description;
    const subcatExist = await subcatCollection.findOne({ name: { $regex: new RegExp("^" + categoryName + "$", "i") }, p_category: parentCategory  });
    
    if (subcatExist) {
      req.flash('error', 'Sub-Category Already Exists');
      return res.redirect('/admin/addsubcategory');
    } else {
      await subcatCollection.create({ name: categoryName, description:description , p_category: parentCategory});
      req.flash('success', 'Sub-Category Added Successfully!');
      res.redirect('/admin/subcategory');
  }
  } catch (error) {
    console.log(err);
    res.send("Error Occured")
  }
}

const LoadUpdateSubCategory = async(req,res)=>{
  try{
    const id = req.params.id;
    const subcategory = await subcatCollection.findById(id);
    const pcategory = await categoryCollection.find()
    res.render('admin/updateSubCategory',{subcategory,pcategory})
  }catch(err){
    console.log(err)
    res.render('user/servererror');
  }
}

const updateSubCategory = async(req,res)=>{
  try{
    const id = req.params.id;
    const subcategory = await subcatCollection.findById(id);
    subcategory.name = req.body.name;
    subcategory.description = req.body.description;
    subcategory.p_category=req.body.parentCategory;
    await subcategory.save()
    res.redirect('/admin/subcategory')
  }catch(err){
    console.log(err)
    res.render('user/servererror')
  }
}

const unlistSubCategory = async (req, res) => {
  try {
      const id = req.params.id;
      const subcategory = await subcatCollection.findById(id);
      subcategory.status = !subcategory.status;
      await subcategory.save();
      res.redirect('/admin/subcategory')
  } catch (err) {
      console.log(err);
      res.render("user/servererror");
  }
}




module.exports = {
  LoadCategory,
  LoadAddCategory,
  addCategory,
  LoadUpdateCategory,
  updateCategory,
  unlistCategory,
  LoadSubCategory,
  LoadAddSubCategory,
  addSubcategory,
  LoadUpdateSubCategory,
  updateSubCategory,
  unlistSubCategory
}
