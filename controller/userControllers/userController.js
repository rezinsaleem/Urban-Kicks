const userCollection = require('../../model/userModel');
const otpCollection = require('../../model/userOtpModel')
const productCollection = require('../../model/productModel')
const bcrypt = require('bcrypt')
const otpgenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const passport = require('passport')


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
        const products = await productCollection.find({ status: true }).limit(12)
        if (req.user) {
            req.session.isAuth = true;
            req.session.userId = req.user._id;
        }
        res.render('user/home', { title: "UrbanKicks-Home", products })
    } catch (error) {
        console.log(error.message);
        res.render('user/servererror')
    }
}

const LoadMen = async (req,res)=>{
    try{
        const categoryId ='65e0d23bf1a57ef5d280576c';
        const products = await productCollection.find({ status: true, category: categoryId })
        res.render('user/men',{ title: "UrbanKicks-Men", products })
    } catch (error) {
        console.log(error.message);
        res.render('user/servererror')
    }
}

const LoadWomen = async (req,res)=>{
    try{
        const categoryId = '65e0d269f1a57ef5d2805770';
        const products = await productCollection.find({ status: true, category: categoryId })
        res.render('user/men',{ title: "UrbanKicks-Women", products })
    }catch(err){
        console.log(error.message);
        res.render('user/servererror')
    }
}

const shopSingle = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await productCollection.findById(productId); 
        res.render('user/product-detail',{product});
    } catch (error) {
        console.log(error);
        res.render('user/servererror');
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
            user.isVerified = true;
            try {
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

const LoadProfile = async (req, res) => {
    try {

        const id = req.session.userId;
        const user = await userCollection.findOne({ _id: id })
        const name = user.name;
        const email = user.email;
        res.render('user/user-profile', { title: "User-Profile", name, email })
    } catch (err) {
        console.log(err)
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
    LoadMen,
    LoadWomen,
    shopSingle,
    signup,
    login,
    LoadOtp,
    verifyotp,
    resendotp,
    LoadProfile,
    logout,
    googleAuthentication,
    googleCallback,
    authFailure,
    facebookAuthentication,
    facebookCallback
}