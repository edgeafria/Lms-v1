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
        // Optional: Replies from instructor
        // reply: {
        //     instructor: { type: mongoose.Schema.ObjectId, ref: 'User' },
        //     text: String,
        //     repliedAt: Date
        // }
    },
    {
        timestamps: true,
    }
);

// Prevent user from submitting more than one review per course
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

// Static method to calculate average rating on the Course model
reviewSchema.statics.calculateAverageRating = async function (courseId) {
    // console.log(`Calculating average rating for course ${courseId}...`); // Debug log
    const stats = await this.aggregate([
        {
            $match: { course: courseId }, // Filter reviews for the specific course
        },
        {
            $group: {
                _id: '$course', // Group by course ID
                count: { $sum: 1 }, // Count the number of reviews
                average: { $avg: '$rating' }, // Calculate the average rating
            },
        },
    ]);
    // console.log('Aggregation Stats:', stats); // Debug log

    try {
        const Course = mongoose.model('Course'); // Get Course model dynamically
        if (stats.length > 0) {
            // If there are reviews, update the course rating fields
            await Course.findByIdAndUpdate(courseId, {
                rating: {
                    count: stats[0].count,
                    // Round average to one decimal place if desired
                    average: Math.round(stats[0].average * 10) / 10,
                },
            });
            // console.log(`Course ${courseId} rating updated: Count=${stats[0].count}, Average=${stats[0].average}`); // Debug log
        } else {
            // If no reviews are left (e.g., last one deleted), reset the rating
            await Course.findByIdAndUpdate(courseId, {
                rating: {
                    count: 0,
                    average: 0,
                },
            });
            // console.log(`Course ${courseId} rating reset.`); // Debug log
        }
    } catch (error) {
        console.error(`Error updating course rating for ${courseId}:`, error);
    }
};

// Call calculateAverageRating after saving a new review
reviewSchema.post('save', function () {
    // 'this' refers to the review document that was just saved
    // 'this.constructor' refers to the Review model
    this.constructor.calculateAverageRating(this.course);
});

// Corrected Remove Hooks:
// Use findOneAndDelete middleware to access the document *before* it's deleted
reviewSchema.pre('findOneAndDelete', async function (next) {
    // 'this' is the query object
    // Execute the query to get the document being deleted and store its courseId
    // Ensure that `this.model.findOne` refers to the Review model
    try {
        // Find the document that matches the query conditions
        const docToDelete = await this.model.findOne(this.getFilter());
        if (docToDelete) {
            this._courseId = docToDelete.course; // Store courseId on the query object
        }
    } catch (error) {
        console.error("Error in pre findOneAndDelete hook:", error);
        // Decide how to handle the error, maybe just log and continue or pass to next(error)
    }
    next();
});

reviewSchema.post('findOneAndDelete', async function () {
    // 'this._courseId' contains the courseId stored in the pre-hook
    if (this._courseId) {
        // Access the static method via the model attached to the query
        await this.model.calculateAverageRating(this._courseId);
    }
});


module.exports = mongoose.model('Review', reviewSchema);