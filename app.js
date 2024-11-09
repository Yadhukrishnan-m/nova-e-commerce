// const mongoose=require("mongoose")
// mongoose.connect("mongodb://localhost:27017/nova_database")

const db=require('./config/config')

   db();
const express=require("express");
const app=express();



app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

const nocache=require('nocache');
app.use(nocache());

const path=require("path")

const Swal = require('sweetalert2')  // for sweet alert 

// Serve static files for user
// app.use('/user', express.static(path.join(__dirname, 'public/user')));

//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/user', express.static(path.join(__dirname, 'public/productImages')));


// Serve static files for admin
// app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute)


//for user route
const userRoute = require('./routes/userRoute');
app.use('/',userRoute)

// for  admin route 


app.listen(3000,()=>{
    console.log("server is running");    
})
