const express = require("express")
const adminRouter = express.Router()
const Auth = require("../middleware/userAuth")
const adminController = require("../controller/adminControllers/adminController")
const productController = require("../controller/adminControllers/productController")
const categoryController = require('../controller/adminControllers/categoryController')

const multer = require("multer")
const upload=multer({dest:'uploads/'})

adminRouter.get("/",Auth.adLogout,adminController.LoadAdmin)

adminRouter.post("/adminlogin",adminController.adminlogin);

adminRouter.get("/dashboard",Auth.adAuth , adminController.LoadDashboard)

adminRouter.get("/customers",Auth.adAuth , adminController.LoadCustomers)

adminRouter.get("/update/:email",Auth.adAuth , adminController.userupdate)

adminRouter.get('/adlogout',Auth.adAuth , adminController.adLogout)

adminRouter.get("/products",Auth.adAuth , productController.LoadProducts)

adminRouter.get("/addproduct",Auth.adAuth , productController.LoadAddProduct)
adminRouter.get('/getSubcategories',Auth.adAuth,productController.fetchSubcat)

adminRouter.post('/addProduct',Auth.adAuth , upload.array('images'),productController.addProduct)

adminRouter.get('/unlist/:id',Auth.adAuth , productController.unlistProduct)

adminRouter.get('/updateProduct/:id',Auth.adAuth , productController.LoadUpdateProduct)

adminRouter.post('/updateproduct/:id',Auth.adAuth , productController.updateProduct)

adminRouter.get('/editImage/:id',Auth.adAuth , productController.LoadEditImage)

adminRouter.get('/deleteimg',Auth.adAuth , productController.deleteImage)

adminRouter.post('/updateimg/:id',Auth.adAuth , upload.array('image'),productController.updateImage)

adminRouter.get('/categories',Auth.adAuth , categoryController.LoadCategory)

adminRouter.get('/addcategory',Auth.adAuth , categoryController.LoadAddCategory)

adminRouter.post('/newcategory',Auth.adAuth , categoryController.addCategory)

adminRouter.get('/unlistcategory/:id',Auth.adAuth , categoryController.unlistCategory)

adminRouter.get('/updatecategory/:id',Auth.adAuth , categoryController.LoadUpdateCategory)

adminRouter.post('/updateCategory/:id',Auth.adAuth , categoryController.updateCategory)

adminRouter.get('/subcategory',Auth.adAuth,categoryController.LoadSubCategory)

adminRouter.get('/addsubcategory',Auth.adAuth,categoryController.LoadAddSubCategory)

adminRouter.post('/newsubcategory',Auth.adAuth,categoryController.addSubcategory)

adminRouter.get('/unlistsubcat/:id',Auth.adAuth,categoryController.unlistSubCategory)

adminRouter.get('/updatesubcategory/:id',Auth.adAuth,categoryController.LoadUpdateSubCategory)

adminRouter.post('/updateSubCategory/:id',Auth.adAuth,categoryController.updateSubCategory)

module.exports = adminRouter;