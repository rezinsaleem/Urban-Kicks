
const orderCollection = require('../../model/orderModel')
const addressCollection = require('../../model/addressModel')
const cartCollection = require('../../model/cartModel')
const categoryCollection = require('../../model/categoryModel')
const productCollection = require('../../model/productModel')
const couponCollection = require('../../model/couponModel')
const userCollection = require('../../model/userModel')

const Razorpay = require('razorpay');
const walletCollection = require('../../model/walletModel')

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
    const itemCount = req.session.cartCount;
    res.render('user/checkout', { title: "Urbankicks - checkout ", address, availableCoupons, data,itemCount, categories, currentPage, successMessages, errorMessages, session: req.session })
  } catch (error) {
    console.log(error)
    res.render("user/servererror")
  }
}

const order = async (req, res) => {
  try {
    const { address, pay } = req.body;
    let amount = parseFloat(req.body.amount.replace(/[^\d.-]/g, ''));
    let wallet = parseInt(req.body.wallet);
    const userId = req.session.userId;
    const cart = await cartCollection.findOne({ userId: userId });
    const useraddress = await addressCollection.findOne({ userId: userId });
    const selectedaddress = useraddress.address[address];
    const items = cart.item.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      price: item.price,
    }));

    for (const item of items) {
      const product = await productCollection.findOne({ _id: item.productId });
      const size = product.stock.findIndex(size => size.size == item.size);
      product.stock[size].quantity -= item.quantity;
      await product.save();
    }

    let order;
    if (pay == "paymentPending") {
      order = new orderCollection({
        userId: userId,
        items: items,
        amount: amount,
        wallet: wallet,
        status: "paymentPending",
        payment: pay,
        address: selectedaddress,
        createdAt: new Date(),
        updated: new Date()
      });
    } else {
      order = new orderCollection({
        userId: userId,
        items: items,
        amount: amount,
        wallet: wallet,
        payment: pay,
        address: selectedaddress,
        createdAt: new Date(),
        updated: new Date()
      });
    }

    cart.item = [];
    cart.total = 0;

    if (wallet > 0) {
      const userWallet = await walletCollection.findOne({ userId: userId });
      const user = await userCollection.findOne({ _id: userId });
      if (user.wallet >= amount) {
        user.wallet -= amount;
        await user.save();
        userWallet.history.push({
          transaction: "Debited",
          amount: amount,
          date: new Date(),
          reason: "Product Purchased"
        });
        await userWallet.save()

      } else {
        userWallet.history.push({
          transaction: "Debited",
          amount: user.wallet,
          date: new Date(),
          reason: "Product Purchased"
        });
        await userWallet.save();
        const remainingAmount = amount - user.wallet; // Calculate remaining amount
        user.wallet = 0;
        await user.save();
        amount = remainingAmount; // Update amount to the remaining amount
      }
    }
    const savedOrder = await order.save();
    await cart.save();

    delete req.session.cart;

    req.session.orderId = savedOrder.orderId;
    res.redirect('/ordercomplete');
  } catch (error) {
    console.log(error);
    res.render("user/servererror");
  }
};


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

const walletTransaction = async (req, res) => {
  try {
    const amount = req.body.amount
    const user = await userCollection.findOne({ _id: req.session.userId })
    if (user.wallet >= amount) {
      res.json({ success: true })
    }
    else {
      res.json({ success: false, amount: user.wallet })
    }
  } catch (error) {
    console.log(error);
    res.render("user/servererror");
  }
}

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.session.userId;
    const coupon = await couponCollection.findOne({ couponCode: couponCode });

    if (coupon && coupon.status === true) {
      const user = await userCollection.findById(userId);

      if (user && user.usedCoupons.includes(couponCode)) {
        res.json({ success: false, message: "Already Redeemed" });
      } else if (
        coupon.expiry > new Date() &&
        coupon.minimumPrice <= subtotal
      ) {
        let dicprice;
        let price;
        if (coupon.type === "percentageDiscount") {
          dicprice = (subtotal * coupon.discount) / 100;
          if (dicprice >= coupon.maxRedeem) {
            dicprice = coupon.maxRedeem;
          }
          price = subtotal - dicprice;
        } else if (coupon.type === "flatDiscount") {
          dicprice = coupon.discount;
          price = subtotal - dicprice;
        }
        await userCollection.findByIdAndUpdate(
          userId,
          { $addToSet: { usedCoupons: couponCode } },
          { new: true }
        );
        req.session.cart = { total: price, dicprice: dicprice, couponApplied: true };
        res.json({ success: true, dicprice, price });
      } else {
        res.json({ success: false, message: "Invalid Coupon" });
      }
    } else {
      res.json({ success: false, message: "Coupon not found" });
    }
  } catch (err) {
    console.error(err);
    res.render("users/servererror")
  }
};
const revokeCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.session.userId;
    const coupon = await couponCollection.findOne({ couponCode: couponCode });

    if (coupon) {
      const user = await userCollection.findOne({ userId: userId });
      if (coupon.expiry > new Date() && coupon.minimumPrice <= subtotal) {
        const dprice = (subtotal * coupon.discount) / 100;
        const dicprice = 0;

        const price = subtotal;

        await userCollection.findByIdAndUpdate(
          userId,
          { $pull: { usedCoupons: couponCode } },
          { new: true }
        );
        req.session.cart = { total: price, dicprice: dicprice, couponApplied: false };
        res.json({ success: true, dicprice, price });
      } else {
        res.json({ success: false, message: "Invalid Coupon" });
      }
    } else {
      res.json({ success: false, message: "coupon not found" });
    }
  } catch (error) {
    console.log(error);
    res.render("user/servererror")
  }
};

const LoadOrderComplete = async (req, res) => {
  try {
    const currentPage = 'cart';
    const categories = await categoryCollection.find({ status: true }).limit(3)
    const orderconfirmation = await orderCollection.findOne({ orderId: req.session.orderId }).populate({
      path: 'items.productId',
      select: 'name, description'
    })
    req.session.cartCount = 0;
    res.render('user/order-complete', { order: orderconfirmation, categories, currentPage, title: "Urbankicks - thankyou" })
  } catch (error) {
    console.log(error)
    res.render('user/servererror')
  }
}

module.exports = {
  LoadCheckOut,
  order,
  upi,
  applyCoupon,
  revokeCoupon,
  LoadOrderComplete,
  walletTransaction,

}