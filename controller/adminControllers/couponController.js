const couponCollection = require('../../model/couponModel')

const LoadCoupon = async(req,res)=>{
  try{
      const coupons = await couponCollection.find({})
      const couponExists=req.flash('couponExists')
      const couponAdded =req.flash('couponAdded')
      res.render('admin/coupons',{coupons,couponExists,couponAdded})

  }
  catch(err){
      console.log(err);
      res.render("user/servererror");

  }
}

const LoadAddCoupon = async(req,res)=>{
  try{
      const couponExists=req.flash('couponExists')
      res.render('admin/addCoupon',{couponExists})
  }
  catch(err){
      console.log(err);
      res.render("user/servererror");

  }
}

const createCoupon=async(req,res)=>{
  try{
      const {couponCode,minimumPrice,discount,expiry,maxRedeem,couponType}=req.body

      const couponExists = await couponCollection.findOne({ couponCode: couponCode });
  
      if (couponExists) {
          req.flash('couponExists', "Coupon already exists")
          res.redirect('/admin/addcoupon');
      }
      else {
          await couponCollection.create({
              couponCode: couponCode,
              type:couponType,
              minimumPrice:minimumPrice,
              discount:discount,
              maxRedeem:maxRedeem,
              expiry:expiry 
              })

          req.flash('couponAdded',"Coupon added successfully!")
          res.redirect('/admin/coupons');

  }
  }catch(error){
      console.log(error);
      res.render("user/servererror");
  }
}

const unlistCoupon=async (req,res)=>{
  try{
      const id = req.params.id;
      const coupon = await couponCollection.findOne({ _id: id });

      coupon.status = !coupon.status;
      await coupon.save();
      res.redirect('/admin/coupons')
  }
  catch(err){
      console.log(err);
      res.render("user/servererror");
  }
}

const LoadEditCoupon=async (req,res)=>{
  try{
      const id=req.params.id;
      couponExists = req.flash('couponExists')
      const coupon=await couponCollection.findOne({_id:id})
      res.render('admin/editCoupon',{coupon:coupon,couponExists})
  }
  catch(err){
      console.log(err);
      res.render("user/servererror");
  }
}

const updateCoupon=async(req,res)=>{
  try{
      const {couponId,couponCode,minimumPrice,discount,expiry,maxRedeem,couponType}=req.body
      const couponExists = await couponCollection.findOne({ 
        couponCode: couponCode,
        minimumPrice: minimumPrice,
        discount: discount,
        expiry: expiry,
        maxRedeem: maxRedeem
    });
    
      if (couponExists) {
          req.flash('couponExists', "Coupon already exists")
          res.redirect('/admin/coupons');
      } 
      else {
          const updatedCoupon = await couponCollection.findByIdAndUpdate(
              couponId,
              {
                  $set: {
                      couponCode:couponCode,
                      type:couponType,
                      minimumPrice:minimumPrice,
                      discount:discount,
                      maxRedeem:maxRedeem,
                      expiry:expiry,
                  }
              }
              
              
          );
          req.flash('couponAdded',"Coupon updated successfully!")
          res.redirect('/admin/coupons');
  
  }


  }
  catch(err){
      console.log(err);
      res.render("user/servererror");
  }
}

module.exports = {
  LoadCoupon,
  LoadAddCoupon,
  createCoupon,
  unlistCoupon,
  LoadEditCoupon,
  updateCoupon,
}