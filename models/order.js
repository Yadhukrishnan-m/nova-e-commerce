const mongoose = require('mongoose');
const order= new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
 
  shippingAddress: {
    street: String,
    houseName: String,
    landmark: String,
    city: String,
    district: String,
    state: String,
    zip: String,
    mobile:String,
    altMobile:String,
    addressType: String
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    mrp: Number,
    offerPrice:Number,
    quantity: Number,
    total: Number,
    size:String
  }],
  appliedCoupon:{type:String},
  couponDiscount:{type:Number},
  offerDiscount:{type:Number},
  orderTotal: { type: Number, required: true },
 
  orderStatus: { type: String, default: 'pending' ,},
  paymentMethod:{  type:String,     enum: ['COD', 'WALLET', 'PAYPAL'],
  },  
  paymentId: String,
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded','cancelled'],
  },
    orderDate: { type: Date, default: Date.now },
//   deliveryDate: Date,
//   discountCode: String,
  totalMrp: Number,
  deliveryCharge:Number
//   shippingCost: Number,
 
});


module.exports = mongoose.model('Order', order);