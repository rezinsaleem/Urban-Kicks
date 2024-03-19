const userCollection = require("../model/userModel")


const isLoggedUser = async (req,res,next)=>{
 try{
  
  const user = await userCollection.findOne({_id: req.session.userId})
  if(req.session.isAuth && user && user.is_blocked==false){
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

const forgot=async(req,res,next)=>{
    try {
        if(req.session.forgot){
            next()
        }else{
            res.redirect('/')
        }
    } catch (err) {
        console.log(err);
        res.render('user/servererror')
    }
}

const signed=async(req,res,next)=>{
    try {
        if(req.session.signup||req.session.forgot){
            next()
        }else{
            res.redirect('/')
        }
    } catch (err) {
        console.log(err);
        res.render('user/servererror')
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

const checkoutValid=async(req,res,next)=>{
    try{
        if(req.session.checkout){
            next()
        }else{
            res.redirect('/login')
        }
    } catch (err) {
        console.log(err);
        res.render('user/serverError')
    }
}


module.exports = {isLoggedUser,isloggedOutUser,adAuth,adLogout,forgot,signed,checkoutValid}