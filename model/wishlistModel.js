const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },

    item: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true,
        },
        size:String
    }
    ],
})


const wishlistCollection = new mongoose.model("wishlist", schema)

module.exports = wishlistCollection;