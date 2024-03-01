const userCollection = require('../../model/userModel');
const categoryCollection = require('../../model/categoryModel')

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
    const categoryExist = await categoryCollection.findOne({ name: { $regex: new RegExp("^" + categoryName + "$", "i") } });
    console.log(categoryName)

    if (categoryExist) {
      console.log("Already Exist");
      req.flash('error', 'Category Already Exists');
      return res.redirect('/admin/addcategory');
  } else {
      await categoryCollection.create({ name: categoryName, description: categoryDescription });
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
    res.render('admin/updateCategory',{category})
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
      res.render("user/serverError");
  }
}

const updateCategory = async(req,res)=>{
  try{
    const id = req.params.id;
    const category = await categoryCollection.findById(id);
    category.name = req.body.name;
    category.description = req.body.description;
    await category.save()
    res.redirect('/admin/categories')
  }catch(err){
    console.log(err)
    res.render('user/servererror')
  }
}


module.exports = {
  LoadCategory,
  LoadAddCategory,
  addCategory,
  LoadUpdateCategory,
  updateCategory,
  unlistCategory
}
