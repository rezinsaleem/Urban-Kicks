const mongoose = require('mongoose')


const categoryschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    discount:{
        type:Number,
        required:true,
        default:0
    },
    types: {
      type: Array,
      default: ['All']
    },
    status: {
      type: Boolean,
      required: true,
      default: true
    }
})


const categoryCollection = new mongoose.model("categories", categoryschema)

module.exports = categoryCollection;