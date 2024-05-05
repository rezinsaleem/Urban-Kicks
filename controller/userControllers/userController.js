const userCollection = require('../../model/userModel');
const otpCollection = require('../../model/userOtpModel')
const productCollection = require('../../model/productModel')
const categoryCollection = require('../../model/categoryModel')
const bcrypt = require('bcrypt')
const otpgenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const passport = require('passport');
const cartCollection = require('../../model/cartModel');
const mongoose = require('mongoose')


const LoadSignIn = async (req, res) => {
    try {

        const errorMessages = req.flash('error');
        const successMessage = req.flash('success');

        res.render('user/login', { errorMessages, successMessage })

    } catch (error) {
        console.log(error.message);
        res.render('user/servererror')
    }
}

const LoadHome = async (req, res) => {
    try {
        const id = req.session.userId;
        const currentPage = 'home';
        const categories = await categoryCollection.find({status:true}).limit(3)
        const searchQuery = req.query.search;
        if (searchQuery) { 
            const searchRegex = new RegExp(searchQuery, 'i'); 
            let searchCriteria = { description: searchRegex, status: true };
            products = await productCollection.find(searchCriteria).exec();
            
        } else {   
            products = await productCollection.find({ status: true }).exec();
         }
        if (req.user) {
            req.session.isAuth = true;
            req.session.userId = req.user._id;
        }

        const result = await cartCollection.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(id) } },
            { $unwind: '$item' },
            { $group: { _id: null, itemCount: { $sum: 1 } } },
        ])
       
        if (result.length > 0) {
            const itemCount = result[0].itemCount;
            req.session.cartCount = itemCount;
        }
        const itemCount = req.session.cartCount;

        res.render('user/home', { title: "UrbanKicks-Home", products ,categories,itemCount,currentPage,searchQuery,scrollToResults: searchQuery && products.length > 0 })
    } catch (error) {
        console.log(error.message);
        res.render('user/servererror')
    }
}

// otp generating function
const generateotp = () => {
    try {
        const otp = otpgenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true,
        });
        console.log("Generated OTP :", otp);
        return otp;
    } catch (error) {
        console.log(error.message);
        res.render('user/servererror')
    }

}

const Email = process.env.Email;
const pass = process.env.pass;

// otp email sending function
const sendmail = async (email, otp) => {
    try {
        var transporter = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: Email,
                pass: pass
            }
        });

        var mailOptions = {
            from: "UrbanKicks<urbankickscompany@gmail.com>",
            to: email,
            subject: "E-Mail Verification",
            text: "Your OTP is: " + otp,
        };

        await transporter.sendMail(mailOptions);
        console.log("e-mail sent successfully")

    } catch (err) {
        console.log("Error in sending mail:", err);
        res.render('user/servererror')
    }
}

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await userCollection.findOne({ email });

        if (existingUser) {
            req.flash('error', 'User already exists. Please choose a different username.');
            res.redirect('/login');
            return;
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a user object to store in the session
        const newUserSessionData = {
            name,
            email,
            password: hashedPassword
        };

        // Store the new user data in the session
        req.session.user = newUserSessionData;
        req.session.signup = true;

        //otp generating
        const otp = generateotp();

        const currentTime = Date.now();
        const expiryTime = currentTime + 60 * 1000;
        const filter = { email: email };
        const update = {
            $set: {
                email: email,
                otp: otp,
                expiry: new Date(expiryTime)
            }
        };
        const options = { upsert: true };

        await otpCollection.updateOne(filter, update, options);
        await sendmail(email, otp);


        res.redirect('/otp');
    } catch (error) {
        console.error('Error during signup:', error);
        req.flash('error', 'An error occurred during signup. Please try again.');
        res.redirect('/');
    }
};

const LoadOtp = async (req, res) => {
    try {
        const otp = await otpCollection.findOne({ email: req.session.user.email });
        res.render('user/otp', {
            expressFlash: {
                otperror: req.flash('otperror')
            }, otp: otp,
        });
    } catch (error) {
        console.log(error.message);
        res.render('user/servererror')
    }
}

const verifyotp = async (req, res) => {
    try {
        const digit1 = req.body.digit1;
        const digit2 = req.body.digit2;
        const digit3 = req.body.digit3;
        const digit4 = req.body.digit4;

        // Combine the digits into a single value
        const enteredotp = digit1 + digit2 + digit3 + digit4;
        const user = req.session.user;
        console.log(enteredotp);
        console.log(req.session.user);
        const email = req.session.user.email;
        const userdb = await otpCollection.findOne({ email: email });
        const otp = userdb.otp;
        const expiry = userdb.expiry;
        console.log(otp);
        if (enteredotp == otp && expiry.getTime() >= Date.now()) {
            // user.isVerified = true;
            try {
                if(req.session.forgot){
                    res.redirect('/newpassword')
                }
                if (req.session.signup) {
                    await userCollection.create(user);

                    const userdata = await userCollection.findOne({ email: email });
                    req.session.userId = userdata._id;
                    req.session.isAuth = true;
                    req.session.signup = false;

                    res.redirect('/')
                }
            } catch (err) {
                console.log("error while inserting in database", err)
            }
        } else {
            req.flash('otperror', 'wrong otp/time expired')
            return res.redirect('/otp')
        }
    } catch (error) {
        console.log(error);
        res.render('user/servererror')
    }
}

const resendotp = async (req, res) => {
    try {
        const email = req.session.user.email;
        const otp = generateotp();
        const currentTime = Date.now();
        const expiryTime = currentTime + 60 * 1000;

        await otpCollection.updateOne({ email: email }, { otp: otp, expiry: new Date(expiryTime) });

        await sendmail(email, otp);
        res.redirect('/otp')

    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
};



const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userCollection.findOne({ email });

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/login');
        }

        const isPassMatch = await bcrypt.compare(password, user.password);

        if (!isPassMatch) {
            req.flash('error', 'Wrong password.');
            return res.redirect('/login');
        }

        if (user.is_blocked == false) {
            req.session.user = user;
            req.session.userId = user._id;
            req.session.isAuth = true;
            return res.redirect('/');
        } else {
            req.flash('error', 'This user is blocked.');
            return res.redirect('/login');
        }
    } catch (error) {
        console.error("Error during login:", error);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
};

const LoadForgotPassword = async(req,res)=>{
    try{
        const emailError = req.flash('emailError')
        res.render('user/forgot',{emailError})
    }catch(error){
        console.log(error);
        res.render('user/servererror')
    }
}

const forgotPassword = async(req,res)=>{
    try{
        const email = req.body.email;
        const emailExist=await userCollection.find({email})
        console.log(email,emailExist);
        if(emailExist.length === 0) {
            req.flash('emailError', 'You are not a registered user!');
            return res.redirect('/forgotpassword');
        }
        if(emailExist[0].email =email){
            req.session.forgot =true;
            req.session.signup = false;
            req.session.user = {email:email}

            const otp = generateotp();

            const currTime = Date.now();
            const expTime = currTime + 60 * 1000;
            await otpCollection.updateOne({ email: email }, { $set: { email: email, otp: otp, expiry: new Date(expTime) } }, { upsert: true });
            await sendmail(email, otp);
            res.redirect('/otp')
        }
    }catch(err){
        console.log(err);
        res.render('user/servererror')
    }
}


const LoadNewPassword = async(req,res)=>{
    try{
        const passwordError = req.flash('passwordError')
        res.render('user/newpassword',{passwordError})
    }catch(err){
        console.log(err);
        res.render('user/servererror');
    }
}

const newPassword = async(req,res) => {
    try{
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        if(password===cpassword){
            const hashedPassword = await bcrypt.hash(password,10);
            const email=req.session.user.email;
            await userCollection.updateOne({email:email},{password:hashedPassword});
            req.session.forgot = false;
            res.redirect('/')
        }else{
            req.flash('passwordError',"Password Does not match")
            res.redirect('/newpassword')
        }
    }catch(err){
        console.log(err);
        res.render('user/servererror')
    }
}




const logout = async (req, res) => {
    try {
        req.session.isAuth = false;
        req.logOut(function (err) {
            if (err) {
                console.error("Error logging out:", err);

                return res.render('user/login');
            }
            // Redirect to the home page after successful logout
            res.redirect('/');
        });

    } catch (err) {
        console.log(err)
        res.render('user/servererror')
    }
}


const googleAuthentication = passport.authenticate('google', { scope: ['email', 'profile'] });

const googleCallback = passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/auth/failure'
});

const authFailure = (req, res) => {
    res.send('Something went wrong..');
};

const facebookAuthentication = passport.authenticate('facebook', { scope: ['email'] });

const facebookCallback = passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/auth/failure'
});







module.exports = {
    LoadSignIn,
    LoadHome,
    signup,
    login,
    LoadOtp,
    verifyotp,
    resendotp,
    LoadForgotPassword,
    forgotPassword,
    LoadNewPassword,
    newPassword,
    logout,
    googleAuthentication,
    googleCallback,
    authFailure,
    facebookAuthentication,
    facebookCallback
}