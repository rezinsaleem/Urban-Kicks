const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'users',
  },
  sessionId: String,
  item:[
    {
      productId: {
        type:  mongoose.Schema.Types.ObjectId,
         ref: 'products',
         required: true,
      },
      size: {
        type: String,
        required: true,
    },
      quantity:{
        type : Number,
        required: true,
      },
      stock:{
        type:Number,
        required: true,
      },
      price:{
        type:Number,
        required: true,
      },
      total:{
        type:Number,
        required:true,
      },
    },
  ],
  total:Number,
})

const cartCollection =  new mongoose.model("cart",cartSchema)

module.exports = cartCollection;