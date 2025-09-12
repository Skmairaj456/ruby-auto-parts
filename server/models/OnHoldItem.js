const mongoose = require('mongoose');

const onHoldItemSchema = new mongoose.Schema({
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
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  // Print tracking for barcode labels
  printedLabels: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastPrintedAt: {
    type: Date,
  },
  printHistory: [{
    printedAt: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
    },
    printedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  }],
}, { timestamps: true });

const OnHoldItem = mongoose.model('OnHoldItem', onHoldItemSchema);

module.exports = OnHoldItem;
