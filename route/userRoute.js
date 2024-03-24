const express = require('express')
require('../oauth/googleauth');
require("../oauth/facebookauth")
const userRouter = express.Router()
const Auth = require('../middleware/userAuth')
const userController = require('../controller/userControllers/userController')
const cartController = require('../controller/userControllers/cartController')
const checkoutController = require('../controller/userControllers/checkoutController')
const profileController = require('../controller/userControllers/profileController')
const productController = require('../controller/userControllers/productController')


userRouter.get('/auth/google',userController.googleAuthentication);
userRouter.get('/auth/google/callback',userController.googleCallback);
userRouter.get('/auth/failure',userController.authFailure);

userRouter.get('/auth/facebook',userController.facebookAuthentication);
userRouter.get('/auth/facebook/callback',userController.facebookCallback);


userRouter.get("/", userController.LoadHome)

userRouter.get('/login',Auth.isloggedOutUser, userController.LoadSignIn)

userRouter.post('/signup', userController.signup)

userRouter.post("/login", userController.login)

userRouter.get("/forgotpassword",userController.LoadForgotPassword)

userRouter.post('/forgotPassword',userController.forgotPassword)

userRouter.get('/newpassword',Auth.forgot,userController.LoadNewPassword)

userRouter.post('/newPassword',Auth.forgot,userController.newPassword)

userRouter.get('/otp',Auth.signed,userController.LoadOtp)

userRouter.post('/verifyotp',userController.verifyotp)

userRouter.get('/resendotp',userController.resendotp)

userRouter.get('/logout',userController.logout)



userRouter.get('/shop/:id', productController.LoadShop)
userRouter.get('/shopSingle/:id', productController.shopSingle);
userRouter.get('/addtowishlist/:id',Auth.isLoggedUser,productController.addToWish)
userRouter.get('/wishlist',Auth.isLoggedUser,productController.LoadWishlist)
userRouter.get('/removefromwishlist/:id',Auth.isLoggedUser,productController.removewishlist)



//cart
userRouter.get('/cart',Auth.isLoggedUser,cartController.LoadCart)
userRouter.post('/addtoCart/:id', Auth.isLoggedUser, cartController.addtocart);
userRouter.post('/updateCartQuantity/:productId/:size', Auth.isLoggedUser, cartController.updateCart)
userRouter.get('/deletcart/:id/:size', Auth.isLoggedUser, cartController.deleteCart)

//checkout

userRouter.get('/checkout',Auth.isLoggedUser,Auth.checkoutValid,checkoutController.LoadCheckOut)
userRouter.post('/order',Auth.isLoggedUser,Auth.checkoutValid, checkoutController.order)


//profile

userRouter.get('/profile',Auth.isLoggedUser,profileController.LoadProfile)

userRouter.get('/addAddress',Auth.isLoggedUser,profileController.LoadAddAddress)
userRouter.post('/addressPost',Auth.isLoggedUser, profileController.addaddress)
userRouter.get('/address',Auth.isLoggedUser,profileController.showaddress)
userRouter.get('/editAddress/:id',Auth.isLoggedUser,profileController.LoadEditAddress)
userRouter.post('/addressupdated/:id',Auth.isLoggedUser,profileController.editaddress)
userRouter.get('/deleteAddress/:id',Auth.isLoggedUser,profileController.deleteAddress)

userRouter.get('/cancelorder/:id', Auth.isLoggedUser, profileController.ordercancelling)
userRouter.get('/returnorder/:id',Auth.isLoggedUser, profileController.orderreturning)
userRouter.get('/order-tracking/:id', Auth.isLoggedUser, profileController.ordertracking)

userRouter.get('/resetpassword',Auth.isLoggedUser,profileController.LoadResetPassword)
userRouter.post('/passwordUpdate',Auth.isLoggedUser,profileController.updatePassword)


module.exports = userRouter;