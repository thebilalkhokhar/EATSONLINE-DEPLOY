import React, { useState, useContext, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";
import {
  createReview,
  getReviewByOrder,
  getOrderStatus,
} from "../services/api";
import styles from "../assets/OrderDetails.module.css";

const ReviewForm = ({ orderId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const { token } = useContext(AuthContext);

  // Check order status and existing review
  useEffect(() => {
    const checkOrderAndReview = async () => {
      try {
        const [statusRes, reviewRes] = await Promise.all([
          getOrderStatus(orderId),
          getReviewByOrder(orderId).catch(() => ({ data: null })),
        ]);

        console.log("Order status:", statusRes.data.status);
        setOrderStatus(statusRes.data.status);

        if (reviewRes.data) {
          console.log("Existing review found:", reviewRes.data);
          setHasSubmitted(true);
          onReviewSubmitted(reviewRes.data);
        }
      } catch (error) {
        console.error("Error checking order and review:", error);
        if (error.response?.status !== 404) {
          toast.error("Error checking order status");
        }
      }
    };
    checkOrderAndReview();
  }, [orderId, token, onReviewSubmitted]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasSubmitted) {
      toast.error("You have already submitted a review for this order");
      return;
    }

    if (orderStatus !== "Delivered") {
      toast.error(`Cannot submit review. Order status is: ${orderStatus}`);
      return;
    }

    // Validate inputs
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit the new review
      console.log("Submitting review for order:", orderId);
      const reviewData = {
        orderId,
        rating,
        comment: comment.trim(),
      };
      console.log("Review data:", reviewData);

      const response = await createReview(reviewData);

      console.log("Review submission response:", response.data);
      setHasSubmitted(true);
      toast.success("Review submitted successfully!");
      onReviewSubmitted(response.data);
    } catch (error) {
      console.error("Error submitting review:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        // If the error indicates an existing review, update the state
        if (error.response.data.reviewId) {
          setHasSubmitted(true);
          // Fetch and display the existing review
          try {
            const existingReview = await getReviewByOrder(orderId);
            if (existingReview.data) {
              onReviewSubmitted(existingReview.data);
            }
          } catch (fetchError) {
            console.error("Error fetching existing review:", fetchError);
          }
        }
      } else {
        toast.error("Error submitting review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return null; // Don't show the form if review is already submitted
  }

  if (orderStatus !== "Delivered") {
    return (
      <div className={styles["review-form"]}>
        <p className="text-red-500">
          Cannot submit review. Order status is: {orderStatus}
        </p>
      </div>
    );
  }

  return (
    <div className={styles["review-form"]}>
      <h3>Write a Review</h3>
      <form onSubmit={handleSubmit} className={styles.reviewForm}>
        <div className={styles.formGroup}>
          <label htmlFor="rating-stars" className={styles.formLabel}>
            Rating
          </label>
          <div
            id="rating-stars"
            className={styles["rating-stars"]}
            role="radiogroup"
            aria-label="Rating"
          >
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <FaStar
                  key={index}
                  size={30}
                  color={
                    ratingValue <= (hover || rating) ? "#f59e0b" : "#e2e8f0"
                  }
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(ratingValue)}
                  role="radio"
                  aria-checked={ratingValue === rating}
                  tabIndex={0}
                  aria-label={`${ratingValue} Star${
                    ratingValue > 1 ? "s" : ""
                  }`}
                />
              );
            })}
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="review-comment" className={styles.formLabel}>
            Comment
          </label>
          <textarea
            id="review-comment"
            className={styles.textarea}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            required
            minLength={1}
            maxLength={500}
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || hasSubmitted}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
