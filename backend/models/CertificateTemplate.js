const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    templateHtml: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'CertificateTemplate',
  certificateTemplateSchema
);