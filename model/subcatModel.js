const mongoose = require('mongoose')
const Schema = mongoose.Schema;



const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  p_category: {
    type: Schema.Types.ObjectId,
    ref: 'categories'
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    default: true,
  }
})


const subcategoryCollection = new mongoose.model("subcategories", schema)

module.exports = subcategoryCollection;