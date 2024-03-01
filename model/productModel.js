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
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        stock: {
            type: Number,
            required: true
        },
        image: {
            type: Array,
            required: true,
        },
        status: {
            type: Boolean,
            default: true,
        }
    }
)

const productCollection = new mongoose.model('products', productSchema)

module.exports = productCollection; 