// const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid'); // Import UUID generator

// const certificateSchema = new mongoose.Schema(
//   {
//     student: {
//       type: mongoose.Schema.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },
//     course: {
//       type: mongoose.Schema.ObjectId,
//       ref: 'Course',
//       required: true,
//       index: true,
//     },
//     enrollment: { // Link to the specific completed enrollment
//       type: mongoose.Schema.ObjectId,
//       ref: 'Enrollment',
//       required: true,
//       unique: true, // Ensure only one certificate per enrollment
//     },
//     certificateId: { // Unique, verifiable ID (like a serial number)
//       type: String,
//       default: () => uuidv4(), // Generate a unique UUID automatically
//       unique: true,
//       required: true,
//       index: true,
//     },
//     issuedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     // Store key details from course/user at the time of issuance for verification
//     courseTitle: {
//       type: String,
//       required: true,
//     },
//     studentName: {
//       type: String,
//       required: true,
//     },
//     completionDate: { // Date the course was actually completed
//         type: Date,
//         required: true,
//     },
//     // Optional: Reference to a specific design template
//     templateUsed: {
//         type: mongoose.Schema.ObjectId,
//         ref: 'CertificateTemplate', // References the model you already have
//     },
//     // Optional: URL where the generated PDF certificate is stored (if applicable)
//     pdfUrl: String,
//   },
//   {
//     timestamps: true, // Adds createdAt, updatedAt
//   }
// );

// module.exports = mongoose.model('Certificate', certificateSchema);