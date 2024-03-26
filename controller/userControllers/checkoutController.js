
const orderCollection = require('../../model/orderModel')
const addressCollection = require('../../model/addressModel')
const cartCollection = require('../../model/cartModel')
const categoryCollection = require('../../model/categoryModel')
const productCollection = require('../../model/productModel')
const couponCollection = require('../../model/couponModel')
const userCollection = require('../../model/userModel')

const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});



const LoadCheckOut = async (req, res) => {
  try {
    const successMessages = req.flash('success')
    const errorMessages = req.flash('error')
    const currentPage = 'cart';
    const userId = req.session.userId;
    req.session.checkoutSave = true;
    const categories = await categoryCollection.find({ status: true }).limit(3)
    const address = await addressCollection.findOne({ userId: userId })
    const data = await cartCollection.findOne({ userId }).populate({
      path: 'item.productId',
      select: 'name description'
    })
    for (const cartItem of data.item || []) {
      const pro = cartItem.productId;
      const product = await productCollection.findOne({ _id: pro._id })
      const size = product.stock.findIndex(s => s.size == cartItem.size);
      if (product.stock[size].quantity < cartItem.quantity) {
        console.log('Selected quantity exceeds available stock for productId:', product._id);
        req.flash('error', `Oops, Selected size is not in stock for the product ${product.description}`)
        return res.redirect('/cart');
      }
    }
    if (data.item.length == 0) {
      return res.redirect('/cart')
    }
    const user = await userCollection.findById(userId)
    const availableCoupons = await couponCollection.find({
      couponCode: { $nin: user.usedCoupons },
      status: true,
    });
    res.render('user/checkout', { title: "Urbankicks - checkout ", address, availableCoupons, data, categories, currentPage, successMessages, errorMessages })
  } catch (error) {
    console.log(error)
    res.render("user/servererror")
  }
}

const order = async (req, res) => {
  try {
    const currentPage = 'cart';
    const categories = await categoryCollection.find({ status: true }).limit(3)
    const { address, pay } = req.body
    let amount = parseFloat(req.body.amount.replace(/[^\d.-]/g, ''));
    const userId = req.session.userId;
    const cart = await cartCollection.findOne({ userId: userId })
    const useraddress = await addressCollection.findOne({ userId: userId })
    const selectedaddress = useraddress.address[address]
    const items = cart.item.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      price: item.price,
    }))
    for (const item of items) {
      const product = await productCollection.findOne({ _id: item.productId })
      const size = product.stock.findIndex(size => size.size == item.size)
      product.stock[size].quantity -= item.quantity
      await product.save()
    }
    const order = new orderCollection({
      userId: userId,
      items: items,
      amount: amount,
      payment: pay,
      address: selectedaddress,
      createdAt: new Date(),
      updated: new Date()
    })
    cart.item = []
    cart.total = 0
    const savedOrder = await order.save()
    await cart.save()
    const orderconfirmation = await orderCollection.findOne({ orderId: savedOrder.orderId }).populate({
      path: 'items.productId',
      select: 'name'
    })
    res.render('user/order-complete', { currentPage, title: "Urban Kicks - thankyou", order: orderconfirmation, categories })
  } catch (error) {
    console.log(error);
    res.render("user/servererror");
  }
}

const upi = async (req, res) => {
  var options = {
    amount: req.body.amount,
    currency: "INR",
    receipt: "order_rcpt"
  };
  instance.orders.create(options, function (err, order) {
    res.send({ orderId: order.id })
  })
}

module.exports = {
  LoadCheckOut,
  order,
  upi,
}