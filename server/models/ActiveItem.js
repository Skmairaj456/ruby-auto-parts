const mongoose = require('mongoose');

const activeItemSchema = new mongoose.Schema({
  uniqueCode: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  brand: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  barcodeUrl: {
    type: String,
  },
  isTaxable: {
    type: Boolean,
    default: false,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const ActiveItem = mongoose.model('ActiveItem', activeItemSchema);

module.exports = ActiveItem;
