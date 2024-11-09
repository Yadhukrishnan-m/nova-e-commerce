

const env = require("dotenv").config();

const mongoose = require("mongoose");
const dbConnect = async () => {
  try {
    
     
    const connect = await mongoose.connect(process.env.MONGO_URI);
    console.log("db connected");
  } catch (error) {
    console.log(error);
  }
};

module.exports = dbConnect;
  
