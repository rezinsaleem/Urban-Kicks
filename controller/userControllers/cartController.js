const productCollection = require("../../model/productModel");
const categoryCollection = require("../../model/categoryModel");
const cartCollection = require("../../model/cartModel")

const addtocart = async (req, res) => {
  try {
    let { size, quantity } = req.body;
    const Nquantity = parseInt(quantity, 10);
    const productId = req.params.id;
    console.log(`Adding product ${productId} to cart with size ${size} and quantity ${quantity}`);

    const product = await productCollection.findOne({ _id: productId });
    if (!product) {
      console.log(`Product with ID ${productId} not found`);
      return res.redirect('/cart');
    }

    const userId = req.session.userId;
    const price = product.discountPrice;

    const stock = await productCollection.findOne({
      _id: productId,
      "stock.size": size,
    });

    const selectedStock = stock.stock.find((item) => {
      return item.size == size;
    });
    if (!selectedStock || selectedStock.quantity === 0) {
      console.log(`Selected stock not available for product ${productId} and size ${size}`);
      req.flash('error',`Selected stock not available for product ${product.description} and size ${size}`)
      return res.redirect('/cart');
    }
    let cart = await cartCollection.findOne({ $or: [{ userId }, { sessionId: req.session.id }] }) ||
      new cartCollection({ sessionId: req.session.id, item: [], total: 0 });


    const productIndex = cart.item.findIndex(item => item.productId.toString() === productId && item.size == size);
    if (productIndex !== -1) {
      cart.item[productIndex].quantity += Nquantity;
      cart.item[productIndex].total = cart.item[productIndex].quantity * price;
    } else {
      cart.item.push({
        productId,
        stock: selectedStock.quantity,
        size: size,
        quantity: parseInt(quantity, 10),
        price,
        total: Nquantity * price
      });
    }

    if (userId && !cart.userId) {
      cart.userId = userId;
    }

    cart.total = cart.item.reduce((acc, item) => acc + item.total, 0);

    await cart.save();
    console.log(`Cart saved successfully`);
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.render('user/servererror');
  }
}


const LoadCart = async (req, res) => {
  try {
    const currentPage = 'cart';
    const products = await productCollection.find({status:true}).limit(4);
    const userId = req.session.userId;
    const categories = await categoryCollection.find({status:true}).limit(3)
    let cart;
    if (userId) {
      cart = await cartCollection.findOne({ userId: userId }).populate({
        path: 'item.productId',
        select: 'name stock image description price'
      });
    } else if (!cart || !cart.item) {
      cart = new cartModel({
        sessionId: req.session.id,
        item: [],
        total: 0
      })
    }

    const insufficientStock = [];

    if (cart && cart.item) {
      for (const cartItem of cart.item) {
        if (cartItem && cartItem.productId && cartItem.productId.stock) {
          const product = cartItem.productId;
          const size = product.stock.findIndex(s => s.size === cartItem.size);

          if (size !== -1 && product.stock[size].quantity < cartItem.quantity) {
            insufficientStock.push({
              item: cartItem,
              availableQuantity: product.stock[size].quantity
            });
          }
        }
      }
    }
    req.session.checkout = true;
    const errorMessages = req.flash('error')
    res.render('user/cart', { title: "UrbanKicks - Cart", cart, insufficientStock, categories, products, errorMessages,currentPage});
  } catch (err) {
    res.render('user/servererror');
    console.error(err);
  }
}

const updateCart = async (req, res) => {
  try {
    const { productId, size } = req.params;
    const { action, cartId } = req.body;
    const cart = await cartCollection.findOne({ _id: cartId });
    const itemIndex = cart.item.findIndex(
      (item) => item._id == productId && item.size == size
    );
    const currentQuantity = cart.item[itemIndex].quantity;
    const price = cart.item[itemIndex].price;
    const opid = cart.item[itemIndex].productId;
    const product = await productCollection.findOne({ _id: opid });
    const selectedinfo = product.stock.findIndex((stock) => stock.size == size);
    const stockLimit = product.stock[selectedinfo].quantity;
    let updatedQuantity;

    if (action == "1") {
      console.log("1");
      updatedQuantity = currentQuantity + 1;
    } else if (action == "-1") {
      console.log("-1");
      updatedQuantity = currentQuantity - 1;
    } else {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    if (updatedQuantity > stockLimit && action == "1") {
      return res
        .status(400)
        .json({ success: false, error: "Quantity exceeds stock limits" });
    } else if (updatedQuantity == 0) {
      return res
        .status(400)
        .json({ success: false, error: "Quantity cannot be zero" });
    }
    cart.item[itemIndex].quantity = updatedQuantity;

    const newProductTotal = price * updatedQuantity;
    cart.item[itemIndex].total = newProductTotal;
    await cart.save();
    const total = cart.item.reduce((acc, item) => acc + item.total, 0);
    cart.total = total;
    await cart.save();
    res.json({
      success: true,
      newQuantity: updatedQuantity,
      newProductTotal,
      total: total,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    res.render("user/servererror");
  }
};

const deleteCart = async (req, res) => {
  try {
      const userId = req.session.userId;
      const pid = req.params.id;
      const size = req.params.size;

      const result = await cartCollection.updateOne(
          { userId: userId },
          { $pull: { item: { _id: pid, size: size } } }
      );

      const updatedCart = await cartCollection.findOne({ userId: userId });
      const newTotal = updatedCart.item.reduce(
          (acc, item) => acc + item.total,
          0
      );
    
      updatedCart.total = newTotal;
      await updatedCart.save();
      res.redirect("/cart");
  
  } catch (error) {
      console.error("Error updating cart quantity:", error);
      res.render("user/servererror");
  }
};







module.exports = {
  LoadCart,
  addtocart,
  updateCart,
  deleteCart,
}