const express = require("express")
require('dotenv').config();
const nocache = require('nocache')
const flash = require('express-flash')
const mongoose = require('mongoose')
const userRouter = require("./route/userRoute")
const adminRouter = require("./route/adminRoute")
const session = require("express-session");
const passport = require("passport");
const multer = require('multer');
const path = require('path');
const os = require('os');

// const PORT = process.env.PORT
const PORT = 8000;

const app = express()

const connect = mongoose.connect(process.env.MONGO_URL);
connect.then(() => {
  console.log("Database Connected Successfully!");
}).catch(() => {
  console.log("Database cannot be connected!");
})

app.use(session({
  secret: "secretsessionsecret",
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(nocache())
app.use(flash())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/userAssets'))
app.use(express.static(__dirname + '/public/adminAssets'))
app.use(express.static(path.join(os.homedir(), 'Downloads')));

app.set('view engine', 'ejs')

app.use('/uploads',express.static("uploads"));

  const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname+".png"); 
      }
    });
    
    const upload = multer({ storage: storage });
    
    app.post('/your-upload-route', upload.array('files'), (req, res) => {
      console.log(req.files);
    });


app.use('/', userRouter)
app.use('/admin', adminRouter)

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`)
})
