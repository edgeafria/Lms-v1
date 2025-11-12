import React, { useState, useEffect } from 'react'; // <-- 1. IMPORT useEffect
import { Star, X, Loader2 } from 'lucide-react';
import { useAuth, axiosInstance } from '../../contexts/AuthContext';
import Modal from '../Modal';
import axios from 'axios'; 

// --- 2. DEFINE THE 'ReviewDetail' TYPE (can be shared) ---
interface ReviewDetail {
  _id: string;
  comment: string;
  rating: number;
  createdAt: string | Date;
  student: any; // We don't need the student stub here
}

// --- 3. UPDATE PROPS ---
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSubmitSuccess: (review: any) => void;
  existingReview: ReviewDetail | null; // <-- ADD 'existingReview' PROP
}

// --- Star Rating Component (No changes) ---
const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label key={ratingValue}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => setRating(ratingValue)}
              className="sr-only"
            />
            <Star
              className={`h-8 w-8 cursor-pointer ${
                ratingValue <= (hover || rating) ? 'text-secondary-500 fill-secondary-500' : 'text-gray-300'
              }`}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
            />
          </label>
        );
      })}
    </div>
  );
};


// --- Main Modal Component ---
const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  courseId, 
  onSubmitSuccess, 
  existingReview // <-- 4. DESTRUCTURE THE NEW PROP
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // --- 5. ADD 'useEffect' TO PRE-FILL THE FORM ---
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      // Reset form if opening for a new review
      setRating(0);
      setComment('');
    }
    setError(null); // Clear errors when modal opens/changes
  }, [isOpen, existingReview]); // Re-run when modal opens or the review changes

  // --- 6. UPDATE 'handleSubmit' TO BE SMARTER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a rating (1-5 stars).');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write a comment (minimum 10 characters).');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let response;
      const reviewData = { courseId, rating, comment };

      if (existingReview) {
        // --- THIS IS AN UPDATE (PUT) ---
        response = await axiosInstance.put(`/reviews/${existingReview._id}`, {
          rating,
          comment,
        });
      } else {
        // --- THIS IS A CREATE (POST) ---
        response = await axiosInstance.post('/reviews', {
          courseId,
          rating,
          comment,
        });
      }

      if (response.data.success) {
        onSubmitSuccess(response.data.data); 
      } else {
        setError(response.data.message || 'An unknown error occurred.');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Error submitting review.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error("Review submission error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal is closed (this is now safer)
  const handleClose = () => {
    // We don't need to reset state here, 
    // the useEffect will handle it when it opens next.
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={existingReview ? "Edit Your Review" : "Leave a Review"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Rating Input */}
        <div className="flex flex-col items-center">
          <label className="block text-sm font-body font-medium text-gray-700 mb-2">
            Your Rating
          </label>
          <StarRating rating={rating} setRating={setRating} />
        </div>

        {/* Comment Input */}
        <div>
          <label htmlFor="comment" className="block text-sm font-body font-medium text-gray-700 mb-1">
            Your Review
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={`What did you like or dislike about this course?`}
            disabled={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-body font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-500 text-base font-body font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : null}
            {isLoading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewModal;