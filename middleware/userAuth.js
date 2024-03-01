const userCollection = require("../model/userModel")


const isLoggedUser = async (req,res,next)=>{
 try{
  
  const user = await userCollection.findOne({_id: req.session.userId})
  if(req.session.isAuth && user){
    next()
  }else{
    res.redirect('/login')
  }
 }catch(err){
  console.log(err)
 }
}


const isloggedOutUser = (req,res,next)=>{
  try{
    if(req.session.isAuth){
        res.redirect('/')
    }else{
        next();
    }
}catch(err){
    console.log(err);
}
}

const adAuth = (req, res, next) => {
  try {
      if (req.session.isAdAuth) {
          next()
      } else {
          res.redirect('/admin')
      }
  } catch (err) {
      console.log(err)
      res.render('user/servererror')
  }
}

const adLogout = (req, res, next) => {
  try {
      if (req.session.isAdAuth) {
          res.redirect('/admin/dashboard')
      } else {
          next()
      }

  } catch (err) {
      console.log(err)
      res.render('user/servererror')
  }
}


module.exports = {isLoggedUser,isloggedOutUser,adAuth,adLogout}