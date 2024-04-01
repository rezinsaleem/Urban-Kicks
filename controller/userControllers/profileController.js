const addressCollection = require('../../model/addressModel');
const categoryCollection = require('../../model/categoryModel')
const userCollection = require('../../model/userModel')
const orderCollection = require('../../model/orderModel');
const productCollection = require('../../model/productModel');
const walletCollection = require('../../model/walletModel');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const bcrypt = require('bcrypt')



const LoadProfile = async (req, res) => {
    try {
        const successMessages = req.flash('success')
        const currentPage = 'profile';
        const categories = await categoryCollection.find({ status: true }).limit(3);
        const id = req.session.userId;
        const user = await userCollection.findOne({ _id: id })
        const orders = await orderCollection.find({ userId: id }).sort({ createdAt: -1 }).populate({
            path: 'items.productId',
            select: 'name image description'
        })
        res.render('user/user-profile', { title: "User-Profile", user, categories, currentPage, orders,successMessages })
    } catch (err) {
        console.log(err)
        res.render('user/servererror')

    }
}

const showaddress=async (req,res)=>{
    try{
        const successMessages  = req.flash('success')
        const errorMessages = req.flash('error')
        const currentPage='profile';
        const userId = req.session.userId
        const categories=await categoryCollection.find({status:true}).limit(3)
        const data = await addressCollection.findOne({ userId: userId })
        req.session.checkoutSave=false;
        res.render('user/address', { title:'UrbanKicks - Addresses',userData: data ,categories,currentPage,errorMessages,successMessages})
    }catch(error){
        console.log(error)
        res.render('user/servererror')
    }
}

const LoadAddAddress = async (req, res) => {
    try {
        const currentPage = 'profile';
        const categories = await categoryCollection.find({ status: true }).limit(3)
        const id = req.session.userId;
        const user = await userCollection.findOne({ _id: id })
        res.render('user/addAddress', { title: "Urban Kicks - profile", categories, currentPage, user })
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}

const addaddress = async (req, res) => {
    try {
        const { name, mobile, email, housename, street, city, state, country, pincode, saveas } = req.body;
        const userId = req.session.userId;
        const existingUser = await addressCollection.findOne({ userId: userId });

        if (existingUser) {
            const existingAddress = existingUser.address.find(addr => addr.save_as === saveas);

            if (existingAddress) {
                const errorMessage = req.session.checkoutSave ? `${existingAddress.save_as} address already exists!` : `${existingAddress.save_as} address already exists! Use edit address..`;
                req.flash('error', errorMessage);
                console.log("already existing address");
                return res.redirect(req.session.checkoutSave ? `/checkout` : `/address`);
            }

            existingUser.address.push({
                name: name,
                mobile: mobile,
                email: email,
                housename: housename,
                street: street,
                city: city,
                state: state,
                country: country,
                pincode: pincode,
                save_as: saveas
            });

            await existingUser.save();
            req.flash('success', "Address added successfully!!!");
            return res.redirect(req.session.checkoutSave ? `/checkout` : `/address`);
        }

        const newAddress = await addressCollection.create({
            userId: userId,
            address: {
                name: name,
                mobile: mobile,
                email: email,
                housename: housename,
                street: street,
                city: city,
                state: state,
                country: country,
                pincode: pincode,
                save_as: saveas,
            },
        });

        req.flash('success', "Address added successfully!!!");
        return res.redirect(req.session.checkoutSave ? `/checkout` : `/address`);
    } catch (error) {
        console.log(error);
        res.render('user/servererror');
    }
}


const LoadEditAddress = async (req, res) => {
    try {
        const currentPage = 'profile';
        const userId = req.session.userId;
        const categories = await categoryCollection.find({ status: true }).limit(3)
        const id = req.params.id;
        
        const address = await addressCollection.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $unwind: '$address'
            },
            {
                $match: { 'address._id': new mongoose.Types.ObjectId(id) }
            }
        ]);

        res.render('user/editAddress', { title:"Urban Kicks- edit address", adress: address[0], categories , currentPage });
    } catch (error) {
        console.log(error);
        res.render('user/serverError');
    }
}

const editaddress = async (req, res) => {
    try {
        const { name, mobile, email, housename, street, city, state, country, pincode, saveas } = req.body;
        const addressId = req.params.id
        const userId = req.session.userId;

        const isAddressExists = await addressCollection.findOne({
            'userId': userId,
            'address': {
                $elemMatch: {
                    '_id': { $ne: addressId },
                    'save_as': saveas,
                    'email': email,
                    'name': name,
                    'mobile': mobile,
                    'housename': housename,
                    'street': street,
                    'pincode': pincode,
                    'city': city,
                    'state': state,
                    'country': country,

                }
            }
        });

        if (isAddressExists) {
            return res.status(400).send('Address already exists');
        }
        const result = await addressCollection.updateOne(
            { 'userId': userId, 'address._id': addressId },
            {
                $set: {
                    'address.$.save_as': saveas,
                    'address.$.name': name,
                    'address.$.email': email,
                    'address.$.mobile': mobile,
                    'address.$.housename': housename,
                    'address.$.street': street,
                    'address.$.pincode': pincode,
                    'address.$.city': city,
                    'address.$.state': state,
                    'address.$.country': country,

                }
            }
        );
        req.flash('success',"Address updated successfully!!!")
        res.redirect('/address');
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = req.params.id;
        const result = await addressCollection.updateOne(
            { userId: userId, 'address._id': id },
            { $pull: { address: { _id: id } } }
        );
        req.flash('error',"Address deleted successfully!!!")
        res.redirect('/address');
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}

const ordercancelling = async (req, res) => {
    try {
        const id = req.params.id
        const update = await orderCollection.updateOne({ _id: id }, { status: "Cancelled", updated: new Date() })
        const result = await orderCollection.findOne({ _id: id })

        if (result.payment == 'upi' || result.payment == 'wallet') {
            const userId = req.session.userId
            const user = await userCollection.findOne({ _id: userId })
            console.log(result.amount)
            user.wallet += parseInt(result.amount)
            await user.save()

            const wallet = await walletCollection.findOne({ userId: userId })
            if (!wallet) {
                const newWallet = new walletCollection({
                    userId: userId,
                    history: [
                        {
                            transaction: "Credited",
                            amount: result.amount,
                            date: new Date(),
                            reason: "Order Cancelled"
                        }
                    ]
                })
                await newWallet.save();
            } else {
                wallet.history.push({
                    transaction: "Credited",
                    amount: result.amount,
                    date: new Date(),
                    reason: "Order Cancelled"
                })
                await wallet.save();
            }
        }

        const items = result.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,

        }))

        for (const item of items) {
            const product = await productCollection.findOne({ _id: item.productId })
            const size = product.stock.findIndex(size => size.size == item.size)
            product.stock[size].quantity += item.quantity
            await product.save()
        }
        res.redirect("/profile")
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}


const ordertracking = async (req, res) => {
    try {
        currentPage = 'profile';
        const id = req.params.id
        const categories = await categoryCollection.find({ status: true }).limit(3)
        const order = await orderCollection.find({ _id: id }).populate({
            path: 'items.productId',
            select: 'name image description'
        })
        res.render('user/ordertracking', { currentPage, order, categories })
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}


const returnReason = async (req, res) => {
    try {
        const itemId = req.body.itemId;
        const reason = req.body.reason;
        const update = await orderCollection.updateOne(
            { _id: itemId },
            { 
                $push: { 
                    return: { 
                        reason: reason, 
                        status: "Pending" 
                    } 
                }, 
                $set: { 
                    updated: new Date() 
                } 
            }
        );
        res.status(200).json({ message: 'Order return request processed successfully' });
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}

const LoadResetPassword = async (req, res) => {
    try {
        const currentPage = 'profile';
        const categories = await categoryCollection.find({ status: true }).limit(3)
        const pass = req.flash('pass')
        res.render('user/resetpassword', { title:"Urbankicks - Reset password ",pass, categories,currentPage })
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}

const updatePassword = async (req, res) => {
    try {
        const { pass, npass} = req.body
        const userId = req.session.userId
        const user = await userCollection.findOne({ _id: userId })

        if (!user.password) {
            req.flash('pass', 'You signed up with Google, try to set password through forgot password!');
            return res.redirect('/resetpassword');
        }
        const isPassword = await bcrypt.compare(npass, user.password)
        if (isPassword) {
            req.flash('pass', 'Enter Different Password')
            return res.redirect('/resetpassword');
        }
        const passwordmatch = await bcrypt.compare(pass, user.password)
        if (passwordmatch) {
            const hashedpassword = await bcrypt.hash(npass, 10)
            const newuser = await userCollection.updateOne({ _id: userId }, { password: hashedpassword })
            console.log("password updated");
            req.flash("success", "Password updated successfully!");
            return res.redirect('/profile')

        }
        else {
            req.flash("pass", "Incorrect Password");
            return res.redirect('/resetpassword');
        }

    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}

const LoadWallet = async (req, res) => {
    try {
        const currentPage = 'profile';
        const userId = req.session.userId;
        const categories = await categoryCollection.find()
        const user = await userCollection.findOne({ _id: userId })
        const wallet = await walletCollection.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: "$history" },
            { $sort: { "history.date": -1 } }
        ]);
        res.render('user/wallet', { wallet: wallet, user: user, categories,title:"Urbankicks - Wallet",currentPage })
    } catch (error) {
        console.log(error)
        res.render('user/servererror')
    }
}

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
  });
  
const walletupi = async (req, res) => {
    console.log(req.body);
    var options = {
        amount: 500,
        currency: "INR",
        receipt: "order_rcpt"
    };
    instance.orders.create(options, function (err, order) {
        res.send({ orderId: order.id })
    })
}

const walletTopup = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await userCollection.findOne({ _id: userId })
        const Amount = parseFloat(req.body.Amount)
        let wallet = await walletCollection.findOne({ userId: userId });
       
        if (!wallet) {
            wallet = new walletCollection({ userId: userId, history: [] });
        }

        user.wallet += Amount;
        wallet.history.push({
            transaction: "Credited",
            amount: Amount,
            date: new Date(),
            reason: "Wallet TopUp"
        });

        await wallet.save();
        await user.save();
        res.redirect("/wallet")
    } catch (error) {
        console.error('Error handling Razorpay callback:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports = {
    LoadProfile,
    LoadAddAddress,
    addaddress,
    ordercancelling,
    ordertracking,
    returnReason,
    showaddress,
    LoadEditAddress,
   editaddress,
   deleteAddress,
   LoadResetPassword,
   updatePassword,
   LoadWallet,
   walletTopup,
   walletupi,
}