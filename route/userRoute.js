const express = require('express')
require('../oauth/googleauth');
require("../oauth/facebookauth")
const userRouter = express.Router()
const Auth = require('../middleware/userAuth')
const userController = require('../controller/userControllers/userController')


userRouter.get('/auth/google',userController.googleAuthentication);
userRouter.get('/auth/google/callback',userController.googleCallback);
userRouter.get('/auth/failure',userController.authFailure);

userRouter.get('/auth/facebook',userController.facebookAuthentication);
userRouter.get('/auth/facebook/callback',userController.facebookCallback);


userRouter.get("/", userController.LoadHome)

userRouter.get('/men', userController.LoadMen)

userRouter.get('/women', userController.LoadWomen)

userRouter.get('/shopSingle/:id', userController.shopSingle);

userRouter.get('/login',Auth.isloggedOutUser, userController.LoadSignIn)

userRouter.post('/signup', userController.signup)

userRouter.post("/login", userController.login)

userRouter.get('/otp',userController.LoadOtp)

userRouter.post('/verifyotp',userController.verifyotp)

userRouter.get('/resendotp',userController.resendotp)

userRouter.get('/profile',Auth.isLoggedUser,userController.LoadProfile)

userRouter.get('/logout',userController.logout)


module.exports = userRouter;