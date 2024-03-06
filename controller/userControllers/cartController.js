const productCollection = require("../../model/productModel");
const categoryCollection = require("../../model/categoryModel");
const cartCollection = require("../../model/cartModel")


const LoadCart = async(req,res)=>{
  try{
    const id = req.session.userId;
    const sessionId = req.session.id;
    const categories = await categoryCollection.find();
    let cart;
    console.log(id)
    if(id){
      cart= await cartCollection.findOne({userId:id}).populate({
        patch:"item.productId",
        select:"image name price "
      });

    }else if(!cart || !cart.item){
      cart = new cartCollection({
        sessionId: sessionId,
        item: [],
        total : 0,
      })
    }
    req.session.checkout =true 
    res.render('user/cart',{cart,categories})
  } catch (error) {
    console.log(error);
    res.render("user/servererror")
  }
};

const showcart  = async (req,res)=>{
  try {
    res.render('user/cart')
  } catch (error) {
    console.log(error)
    res.render('user/servererror')
  }
}

// const addToCart = async(req,res)=>{
//   try{
//     const pid = req.params.id;
//     const product = await productCollection.findOne({_id: pid});
//     const userId = req.session.userId;
//     const price = product.price;
//     const stock = product.stock;
//     const quantity = 1;

//     if(stock==0){
//       res.redirect('/cart')
//     }else{
//       let cart;
//       if(userId){
//         cart = await cartCollection.findOne({userId : userId})
//       }
//       if(!cart){
//         cart = await cartCollection.findOne({ sessionId: req.session.id})
//       }
//       if(!cart){
//         cart= new cartCollection({
//           sessionId:req.session.id,
//           item:[],
//           total:0,
//         });
//       }
//       const  productExist = cart.item.findIndex((item) => item.productId == pid );


//     }
//   }
// }



module.exports= {
  LoadCart,
  showcart

}