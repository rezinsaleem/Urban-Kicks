const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'categories',
      required: true,
    },
    sub_category: {
      type: Schema.Types.ObjectId,
      ref: 'subcategories',
      required: true,
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      required: true,
      default:0
    },
    discountPrice: {
      type: Number,
      required: true
    },
    stock: [{
      size: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    }],
    image: {
      type: Array,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    created: {
      type: Date,
      default: new Date()
    }
  }
)

const productCollection = new mongoose.model('products', productSchema)

module.exports = productCollection; 