const categoryCollection = require('../../model/categoryModel')



const LoadAbout  = async(req,res)=>{
  const categories = await categoryCollection.find({status:true}).limit(3)
  const itemCount = req.session.cartCount;
  res.render('user/about',{title: 'urbankicks - about',currentPage:'about',categories,itemCount})
}
const LoadContact  = async(req,res)=>{
  const categories = await categoryCollection.find({status:true}).limit(3)
  const itemCount = req.session.cartCount;
  res.render('user/contact',{title: 'urbankicks - Contact',currentPage:'contact',categories,itemCount})
}
module.exports ={
  LoadAbout,
  LoadContact
}