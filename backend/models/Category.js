const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, 'Category label is required'],
    trim: true,
    unique: true,
  },
  value: {
    type: String,
    required: [true, 'Category value (slug) is required'],
    trim: true,
    unique: true,
    lowercase: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
