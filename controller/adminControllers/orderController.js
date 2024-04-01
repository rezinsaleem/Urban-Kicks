const productCollection=require('../../model/productModel')
const orderCollection =require('../../model/orderModel')
const userCollection = require('../../model/userModel');
const walletCollection = require('../../model/walletModel')


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

const LoadOrderReturn=async(req,res)=>{
    try{
        const order = await orderCollection.find({ 'return': { $exists: true, $ne: [] } }).sort({ createdAt: -1 }).populate({
            path: 'items.productId',
            select: 'name'
        })
        res.render("admin/return", { order: order })
    }catch(error){
        console.log(error);
        res.render("user/servererror");
    }
}

const returnApprove=async(req,res)=>{
    try{
        const orderId=req.params.id;
        const update = await orderCollection.updateOne(
            { _id: orderId },
            { 
                $set: { 
                    status: "returned", 
                    updated: new Date(), 
                    "return.$[].status": "Accepted" 
                } 
            }
        );
        const order=await orderCollection.findOne({_id:orderId})
        const userId=order.userId;
        const user=await userCollection.findOne({ _id: userId })
        user.wallet += order.amount
        await user.save()

        const wallet = await walletCollection.findOne({ userId: userId })
        if (!wallet) {
            const newWallet = new walletCollection({
                userId: userId,
                history: [
                    {
                        transaction: "Credited",
                        amount: order.amount,
                        date: new Date(),
                        reason:"Order Returned"
                    }
                ]
            })
            await newWallet.save();
        } else {
            wallet.history.push({
                transaction: "Credited",
                amount: order.amount,
                date: new Date(),
                reason:"Order Returned"
            })
            await wallet.save();
        }

        const items = order.items.map(item => ({
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

        res.redirect('/admin/orderReturn');
    }catch(error){
        console.log(error);
        res.render("user/servererror");
    }
}

const returnReject=async(req,res)=>{
    try{
        const orderId=req.params.id;
         const update = await orderCollection.updateOne(
            { _id: orderId },
            { 
                $set: {   
                    "return.$[].status": "Rejected" ,
                } 
            }
        );
        res.redirect('/admin/orderReturn');
    }catch(error){
        console.log(error);
        res.render("user/servererror");
    }
}

module.exports={LoadOrder,orderstatus,LoadOrderReturn,returnApprove,returnReject}