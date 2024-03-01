const userCollection = require("../../model/userModel")
const bcrypt = require("bcrypt")


const LoadAdmin = async(req,res)=>{
  try{
    if (req.session.isAdAuth) {
      return res.redirect('/admin/dashboard')
  }
    const errorMessages = req.flash('error')
    res.render('admin/adminlogin',{errorMessages})
  }catch(err){
    console.log(err)
    res.render('user/servererror')
  }
}

const adminlogin = async(req,res)=>{
  try{
   const { email,password } = req.body;
   const admin = await userCollection.findOne({email})
   console.log(admin)

   if(!admin){
    req.flash('error', 'Admin not found!')
    return res.redirect('/admin')
   }
    
   const isPassMatch = await bcrypt.compare(password,admin.password)

   if(!isPassMatch){
    req.flash('error','Wrong Password!')
    return res.redirect('/admin')
   }

   if(admin.is_admin == true){
    req.session.admin = email;
    req.session.isAdAuth = true;
    return res.redirect('/admin/dashboard');
   }else{
    req.flash('error','You are not an Admin!')
    return res.redirect('/admin')
   }

  }catch(error){
    console.error('An unexpected error occurred:', error);
    req.flash('error', 'An unexpected error occurred');
    return res.redirect('/admin');
  }
}

const LoadDashboard = async(req,res)=>{
  try{
    res.render('admin/dashboard')
  }catch(error){
    console.log(error)
    res.render('user/servererror')
  }
}

const LoadCustomers = async (req,res)=>{
  try{
    const users = await userCollection.find().exec();
    res.render('admin/customers',{users})
  }catch(err){
    console.log(err)
    res.render('user/servererror')
  }
}

const userupdate = async (req, res) => {
  try {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.is_blocked = !user.is_blocked;
      if(user.is_blocked)
      {
        req.session.isAuth=false;
      }

      await user.save();
      res.redirect("/admin/customers");
   
  } catch (error) {
    console.log(error);
   res.render('user/servererror')
  }
};

const adLogout = (req, res) => {
  try {
      req.session.isAdAuth = false;
      res.redirect('/admin')
  } catch (err) {
      console.log(err);
      res.render("user/servererror");
  }
}

module.exports = {
  LoadAdmin,
  adminlogin,
  LoadDashboard,
  LoadCustomers,
  userupdate,
  adLogout

}