const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        course: {
            type: mongoose.Schema.ObjectId,
            ref: 'Course',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: [true, 'Review comment is required'],
            trim: true, // Added trim
            maxlength: [1000, 'Comment cannot exceed 1000 characters'] // Added max length
        },
    },
    {
        timestamps: true,
    }
);

// Prevent user from submitting more than one review per course
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

// --- 🐞 THIS IS THE NEW, COMBINED FUNCTION ---
reviewSchema.statics.calculateAverageRating = async function (courseId) {
    const stats = await this.aggregate([
        {
            $match: { course: courseId }, // Filter reviews for the specific course
        },
        {
            $group: {
                _id: '$course', // Group by course ID
                count: { $sum: 1 }, // Count the number of reviews
                average: { $avg: '$rating' }, // Calculate the average rating
                reviewIds: { $push: '$_id' } // <-- 1. GET ALL REVIEW IDs
            },
        },
    ]);

    try {
        const Course = mongoose.model('Course'); // Get Course model dynamically
        if (stats.length > 0) {
            // If there are reviews, update the course with ALL new data
            await Course.findByIdAndUpdate(courseId, {
                rating: {
                    count: stats[0].count,
                    average: Math.round(stats[0].average * 10) / 10,
                },
                reviews: stats[0].reviewIds // <-- 2. SAVE THE REVIEW IDs
            });
        } else {
            // If no reviews are left (e.g., last one deleted), reset everything
            await Course.findByIdAndUpdate(courseId, {
                rating: {
                    count: 0,
                    average: 0,
                },
                reviews: [] // <-- 3. CLEAR THE REVIEW IDs
            });
        }
    } catch (error) {
        console.error(`Error updating course rating for ${courseId}:`, error);
    }
};

// Call calculateAverageRating after saving a new review
reviewSchema.post('save', function () {
    this.constructor.calculateAverageRating(this.course);
});

// Corrected Remove Hooks:
reviewSchema.pre('findOneAndDelete', async function (next) {
    try {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (docToDelete) {
            this._courseId = docToDelete.course; 
        }
    } catch (error) {
        console.error("Error in pre findOneAndDelete hook:", error);
    }
    next();
});

reviewSchema.post('findOneAndDelete', async function () {
    if (this._courseId) {
        await this.model.calculateAverageRating(this._courseId);
    }
});


module.exports = mongoose.model('Review', reviewSchema);