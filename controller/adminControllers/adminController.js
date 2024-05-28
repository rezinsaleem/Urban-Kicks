const userCollection = require("../../model/userModel")
const bcrypt = require("bcrypt")
const orderCollection=require('../../model/orderModel')
const categoryCollection = require('../../model/categoryModel')
const fs=require('fs')
const os=require('os')
const path=require('path')
const exceljs = require('exceljs')
const puppeteer=require('puppeteer')



const LoadAdmin = async(req,res)=>{
  try{
    if (req.session.isAdAuth) {
      return res.redirect('/admin/dashboard')
  }
    const errorMessages = req.flash('error')
    res.render('admin/adminLogin',{errorMessages})
  }catch(err){
    console.log(err)
    res.render('user/servererror')
  }
}

const adminlogin = async(req,res)=>{
  try{
   const { email,password } = req.body;
   const admin = await userCollection.findOne({email})

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
  try {
    const userCount = await userCollection.countDocuments({});
    const perPage = 3;
    const page = parseInt(req.query.page) || 1;
    const products = await orderCollection.aggregate([
      {
        $match: {
            status: "delivered" 
        }
    },  
      {
            $unwind: '$items',
        },
        {
            $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'productDetails',
            },
        },
        {
            $unwind: '$productDetails',
        },
        {
            $group: {
                _id: '$items.productId',
                totalSold: { $sum: '$items.quantity' },
                totalPrice: { $sum: { $multiply: ['$items.quantity', '$productDetails.price'] } },
                totalDiscountPercent: { $first: '$productDetails.discount' },
                productName: { $first: '$productDetails.name' },
                productImage: { $first: '$productDetails.image' },
            },
        },
        {
            $addFields: {
                totalDiscount: { $multiply: ['$totalPrice', { $divide: ['$totalDiscountPercent', 100] }] },
            },
        },
        {
            $sort: { totalSold: -1 },
        },
    ]);
    let totalDiscountSum = 0;

    products.forEach(product => {
        totalDiscountSum += product.totalDiscount;
    });

    const orders = await orderCollection.aggregate([
        {
            $match: {
                status: {
                    $nin: ["Cancelled", "returned"]
                }
            },
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
            },
        },
    ]);
    const totalPages = Math.ceil(products.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    const productsPaginated = products.slice(startIndex, endIndex);
    const errorMessages = req.flash('error')
    res.render('admin/dashboard', { errorMessages,userCount, products: productsPaginated, currentPage: page, totalPages, orders, totalDiscountSum })
} catch (err) {
    console.log(err);
    res.render("user/servererror");
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

const chartData = async (req, res) => {
  try {
      const selected = req.body.selected;
      
      if (selected == 'month') {
          const orderByMonth = await orderCollection.aggregate([
            {
              $match: {
                          status: "delivered"       
              }
          },
          {
                  $group: {
                      _id: {
                          month: { $month: '$createdAt' },
                      },
                      count: { $sum: 1 },
                  }
              }
          ])
          const salesByMonth = await orderCollection.aggregate([
            {
              $match: {
                          status: "delivered"       
              }
          },
           {
                  $group: {
                      _id: {
                          month: { $month: '$createdAt' },
                      },

                      totalAmount: { $sum: '$amount' },

                  }
              }
          ])
          
          const responseData = {
              order: orderByMonth,
              sales: salesByMonth
          };


          res.status(200).json(responseData);
      }
      else if (selected == 'year') {
          const orderByYear = await orderCollection.aggregate([
            {
              $match: {
                          status: "delivered"       
              }
          },
           {
                  $group: {
                      _id: {
                          year: { $year: '$createdAt' },
                      },
                      count: { $sum: 1 },
                  }
              }
          ])
          const salesByYear = await orderCollection.aggregate([
            {
              $match: {
                          status: "delivered"       
              }
          },
          {
                  $group: {
                      _id: {
                          year: { $year: '$createdAt' },
                      },
                      totalAmount: { $sum: '$amount' },
                  }
              }
          ])
         
          const responseData = {
              order: orderByYear,
              sales: salesByYear,
          }
          res.status(200).json(responseData);
      }

  }
  catch (err) {
      console.log(err);
      res.send("Error Occured")
  }

}


const isFutureDate = (selectedDate) => {
  try {
      const selectedDateTime = new Date(selectedDate);
      const currentDate = new Date();
      return selectedDateTime > currentDate;

  } catch (error) {
      console.log(error);
      res.render("users/servererror") 
  }
}

const downloadsales = async (req, res) => {
  try {
      
      const { startDate, endDate, submitBtn } = req.body;

      let sdate=isFutureDate(startDate)
      let edate=isFutureDate(endDate)

      if(!startDate||!endDate){
        req.flash('error', 'Choose a date')
        return res.redirect('/admin/dashboard')
    }
      if(sdate){
        req.flash('error','invalid date')
        return res.redirect('/admin/dashboard')
      }
      if(edate){
        req.flash('error','invalid date')
        return res.redirect('/admin/dashboard')

      }

      const salesData = await orderCollection.aggregate([
          {
              $match: {
                  createdAt: {
                      $gte: new Date(startDate),
                      $lt: new Date(endDate),
                  },
                  status: {
                    $nin: ["Cancelled", "returned"]
                }
              },
          },
          {
              $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalAmount: { $sum: '$amount' }, 
              },
          },
      ]);


      

      const products = await orderCollection.aggregate([
        {
            $match: {
              createdAt: {
                  $gte: new Date(startDate),
                  $lt: new Date(endDate),
              },
              status: {
                $nin: ["Cancelled", "returned"]
            }
          },
        },
        {
            $unwind: '$items',
        },
        {
            $group: {
                _id: '$items.productId',
                totalSold: { $sum: '$items.quantity' },
            },
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails',
            },
        },
        {
            $unwind: '$productDetails',
        },
        {
            $project: {
                _id: 1,
                totalSold: 1,
                productName: '$productDetails.description',
            },
        },
        {
            $sort: { totalSold: -1 },
        },
    ]);
   
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sales Report</title>
          <style>
              body {
                  margin-left: 20px;
              }
          </style>
      </head>
      <body>
          <h2 align="center"> Sales Report</h2>
          Start Date:${startDate}<br>
          End Date:${endDate}<br> 
          <center>
              <table class="mt-5" style="border-collapse: collapse;">
                  <thead>
                      <tr>
                          <th style="border: 1px solid #000; padding: 8px;">Sl N0</th>
                          <th style="border: 1px solid #000; padding: 8px;">Product Name</th>
                          <th style="border: 1px solid #000; padding: 8px;">Quantity Sold</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${products
                          .map(
                              (item, index) => `
                              <tr>
                                  <td style="border: 1px solid #000; padding: 8px;">${index + 1}</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${item.productName}</td>
                                  <td style="border: 1px solid #000; padding: 8px;">${item.totalSold}</td>
                              </tr>`
                          )
                          .join("")}
                      <tr>
                          <td style="border: 1px solid #000; padding: 8px;"></td>
                          <td style="border: 1px solid #000; padding: 8px;">Total No of Orders</td>
                          <td style="border: 1px solid #000; padding: 8px;">${salesData[0]?.totalOrders || 0}</td>
                      </tr>
                      <tr>
                          <td style="border: 1px solid #000; padding: 8px;"></td>
                          <td style="border: 1px solid #000; padding: 8px;">Total Revenue</td>
                          <td style="border: 1px solid #000; padding: 8px;">${salesData[0]?.totalAmount || 0}</td>
                      </tr>
                  </tbody>
              </table>
          </center>
      </body>
      </html>
  `;

  if (submitBtn == 'pdf') {
    const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);

        // Generate PDF
        const pdfBuffer = await page.pdf();

        await browser.close();

        const downloadsPath = path.join(os.homedir(), 'Downloads');
        const pdfFilePath = path.join(downloadsPath, 'sales.pdf');

        // Save the PDF file locally
        fs.writeFileSync(pdfFilePath, pdfBuffer);

        // Send the PDF as a response
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales.pdf');
        res.status(200).end(pdfBuffer);
  } else {
    const totalAmount = salesData[0]?.totalAmount || 0;
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");
    sheet.columns = [
        { header: "Sl No", key: "slNo", width: 10 },
        { header: "Product Name", key: "productName", width: 25 },
        { header: "Quantity Sold", key: "productQuantity", width: 15 },
        // { header: "Total Price", key: "productTotal", width: 15 },
        // { header: "Discount(%)", key: "totalDiscountPercent", width: 15 },
        // { header: "Total Discount Amount", key: "totalDiscount", width: 20 }
    ];
    products.forEach((item, index) => {
        sheet.addRow({
            slNo: index + 1,
            productName: item.productName,
            productQuantity: item.totalSold,
            // productTotal: item.totalPrice,
            // totalDiscountPercent: `${item.totalDiscountPercent}%`,
            // totalDiscount: item.totalDiscount
        });
    });
    sheet.addRow({});
    sheet.addRow({ productName: 'Total No of Orders', productQuantity: salesData[0]?.totalOrders || 0 });
    sheet.addRow({ productName: 'Total Revenue', productQuantity: totalAmount });
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        "attachment;filename=report.xlsx"
    );
    await workbook.xlsx.write(res);
}
  } catch (err) {
      console.error(err);
      res.render("user/servererror");
    }
};

const bestSellingProduct = async (req, res) => {
  try {

    const bestSellingProducts = await orderCollection.aggregate([
      {
        $match: {
          status: {
            $nin: ["Cancelled", "returned"]
          }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$productDetails'
      },
      {
        $group: {
          _id: '$productDetails.description',
          totalSales: { $sum: '$items.quantity' },
          productName: { $first: '$productDetails.description' }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: 1,
          totalSales: 1
        }
      }
    ]);
    

      res.status(200).json({bestSellingProducts,item:'Product'})
    

  } catch (error) {

      console.log("error in best selling product",error)


  }
}

const bestSellingBrands = async (req, res) => {
  try {

    const bestSellingBrands = await orderCollection.aggregate([
      {
          $unwind: "$items"
      },
      {
          $lookup: {
              from: 'products',
              localField: 'items.productId',
              foreignField: '_id',
              as: 'productDetails'
          }
      },
      {
          $unwind: "$productDetails"
      },
      {
          $group: {
              _id: {
                  brand: "$productDetails.name" // Assuming product name as brand name
              },
              totalSales: { $sum: { $cond: [{ $ifNull: ["$items.totalProductAmount", 0] }, "$items.totalProductAmount", 0] } }
          }
      },
      {
          $sort: { totalSales: -1 }
      },
      {
          $limit: 10
      },
      {
          $project: {
              _id: 0,
              brand: "$_id.brand",
              totalSales: 1
          }
      }
  ]);
  
      res.status(200).json({bestSellingBrands,item:'Brand'})
    

  } catch (error) {

      console.log("error in best selling brand",error);

  }
}

const bestSellingCategories=async(req,res)=>{
  try {
      
    const bestSellingCategories = await orderCollection.aggregate([
      {
          $unwind: "$items"
      },
      {
          $lookup: {
              from: 'products',
              localField: 'items.productId',
              foreignField: '_id',
              as: 'productDetails'
          }
      },
      {
          $unwind: "$productDetails"
      },
      {
          $lookup: {
              from: 'categories',
              localField: 'productDetails.category',
              foreignField: '_id',
              as: 'categoryDetails'
          }
      },
      {
          $unwind: "$categoryDetails"
      },
      {
          $group: {
              _id: {
                  categoryId: "$categoryDetails._id",
                  categoryName: "$categoryDetails.name"
              },
              totalSales: { $sum: "$items.quantity" }
          }
      },
      {
          $sort: { totalSales: -1 }
      },
      {
          $limit: 10
      },
      {
          $project: {
              _id: 0,
              categoryId: "$_id.categoryId",
              categoryName: "$_id.categoryName",
              totalSales: 1
          }
      }
  ]);

      res.status(200).json({bestSellingCategories,item:'Category'})
    

  } catch (error) {

      console.log("error in best selling product",error)


  }
}

module.exports = {
  LoadAdmin,
  adminlogin,
  LoadDashboard,
  LoadCustomers,
  userupdate,
  adLogout,
  downloadsales,
  chartData,
  bestSellingProduct,
  bestSellingCategories,
  bestSellingBrands,

}