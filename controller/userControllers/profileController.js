const addressCollection = require('../../model/addressModel');
const categoryCollection = require('../../model/categoryModel')
const userCollection = require('../../model/userModel')
const orderCollection = require('../../model/orderModel');
const productCollection = require('../../model/productModel');



const LoadProfile = async (req, res) => {
    try {
        const currentPage = 'profile';
        const categories = await categoryCollection.find({ status: true }).limit(3);
        const id = req.session.userId;
        const user = await userCollection.findOne({ _id: id })
        const orders = await orderCollection.find({ userId: id }).sort({ createdAt: -1 }).populate({
            path: 'items.productId',
            select: 'name image description'
        })
        res.render('user/user-profile', { title: "User-Profile", user, categories, currentPage, orders })
    } catch (err) {
        console.log(err)
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
            const existingAddress = await addressCollection.findOne({
                'userId': userId,
                'address.name': name,
                'address.mobile': mobile,
                'address.email': email,
                'address.housename': housename,
                'address.street': street,
                'address.city': city,
                'address.state': state,
                'address.country': country,
                'address.pincode': pincode,
                'address.save_as': saveas
            });

            if (existingAddress) {
                if (req.session.checkoutSave) {
                    console.log("already existing address")
                    return res.redirect(`/checkout`)
                }
                return res.redirect(`/address`)
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
            if (req.session.checkoutSave) {
                return res.redirect(`/checkout`)
            }
            return res.redirect('/address');
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
        if (req.session.checkoutSave) {
            res.redirect(`/checkout`)
        }
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

const orderreturning = async (req, res) => {
    try {
        const id = req.params.id
        const update = await orderCollection.updateOne({ _id: id }, { status: "returned", updated: new Date() })
        const result = await orderCollection.findOne({ _id: id })


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

const showaddress=async (req,res)=>{
    try{
        const currentPage='profile';
        const userId = req.session.userId
        const categories=await categoryCollection.find({status:true}).limit(3)
        const data = await addressCollection.findOne({ userId: userId })
        req.session.checkoutSave=false;
        res.render('user/address', { title:'UrbanKicks - Addresses',userData: data ,categories,currentPage})
    }catch(error){
        console.log(error)
        res.render('user/servererror')
    }
}


module.exports = {
    LoadProfile,
    LoadAddAddress,
    addaddress,
    ordercancelling,
    ordertracking,
    orderreturning,
    showaddress,
   
}