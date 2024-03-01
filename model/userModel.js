const { default: mongoose } = require("mongoose");

// Create Schema
const userSchema = new mongoose.Schema({
  name: {
      type:String,
      required: true
  },
  password: {
      type: String,
      required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  is_admin:{
      type:Boolean,
      required:true,
      default:false
  },
  is_blocked:{
      type: Boolean,
      required:true,
      default:false
  }
});

const userCollection = new mongoose.model('users',userSchema);

module.exports = userCollection;