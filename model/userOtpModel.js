const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const otpSchema = new mongoose.Schema({
  email:{
    type:String,
    required: true,
    unique : true
  },
  otp:{
    type: Number,
    required: true
  },
  expiry:{
    type:Date,
    required: true
  }
})

const otpCollection = new mongoose.model("otp_db",otpSchema);

module.exports = otpCollection;