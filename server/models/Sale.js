const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActiveItem', // Assuming you have an ActiveItem model
    required: true,
  },
  // Store essential item details directly to preserve data even if item is deleted
  itemName: {
    type: String,
    required: true,
  },
  itemBrand: {
    type: String,
    default: '',
  },
  itemUniqueCode: {
    type: String,
    default: '',
  },
  quantity: {
    type: Number,
    required: true,
  },
  priceAtSale: { // Price of the item at the time of sale
    type: Number,
    required: true,
  },
});

const SaleSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  customerContact: {
    type: String,
    required: false, // Make optional if not always provided
  },
  itemsSold: [SaleItemSchema],
  discount: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  subTotal: {
    type: Number,
    default: 0,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  billedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User who made the sale
    required: true,
  },
  saleDate: {
    type: Date,
    default: Date.now,
  },
  billId: {
    type: String,
    unique: true,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);
