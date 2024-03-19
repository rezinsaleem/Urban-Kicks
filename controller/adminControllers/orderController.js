const productCollection=require('../../model/productModel')
const orderCollection =require('../../model/orderModel')


const LoadOrder = async(req,res)=>{
    try{
        const order = await orderCollection.find({}).sort({ createdAt: -1 }).populate({
            path: 'items.productId',
            select: 'name description'
        })
        res.render("admin/orders", { order: order })
    }catch(error){
        console.log(error);
        res.render("user/servererror");
    }
}

const orderstatus=async(req,res)=>{
    try{
        const { orderId, status } = req.body
        const updateOrder = await orderCollection.updateOne({ _id: orderId }, { status: status, updated: new Date() })
        res.redirect('/admin/orders')
    }catch(error){
        console.log(error);
        res.render("user/servererror");
    }
}

module.exports={LoadOrder,orderstatus}