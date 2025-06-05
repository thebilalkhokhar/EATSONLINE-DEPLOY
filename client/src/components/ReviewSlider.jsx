import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import { getReviews } from '../services/api';
import '../assets/ReviewSlider.css';

const ReviewSlider = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const DUMMY_REVIEWS = [
    {
      _id: 'dummy1',
      comment: 'Amazing food and super fast delivery! Highly recommended.',
      rating: 5,
      userId: { name: 'Ali R.' },
      restaurantId: { name: 'Foodies Hub' }
    },
    {
      _id: 'dummy2',
      comment: 'Great taste and fresh ingredients. Will order again!',
      rating: 4,
      userId: { name: 'Sara K.' },
      restaurantId: { name: 'Pizza Palace' }
    },
    {
      _id: 'dummy3',
      comment: 'Delivery was a bit late but the food was hot and delicious.',
      rating: 4,
      userId: { name: 'Usman A.' },
      restaurantId: { name: 'Burger Town' }
    },
    {
      _id: 'dummy4',
      comment: 'Loved the variety and the service. 10/10!',
      rating: 5,
      userId: { name: 'Hina M.' },
      restaurantId: { name: 'Desi Diner' }
    },
    {
      _id: 'dummy5',
      comment: 'Good value for money. Portions were generous.',
      rating: 4,
      userId: { name: 'Bilal S.' },
      restaurantId: { name: 'Biryani Express' }
    },
    {
      _id: 'dummy6',
      comment: 'Tried for the first time, very satisfied!',
      rating: 5,
      userId: { name: 'Mehwish Z.' },
      restaurantId: { name: 'Tandoori Nights' }
    },
    {
      _id: 'dummy7',
      comment: 'Food was okay, but packaging could be better.',
      rating: 3,
      userId: { name: 'Fahad I.' },
      restaurantId: { name: 'Wrap & Roll' }
    },
    {
      _id: 'dummy8',
      comment: 'Excellent service and tasty food!',
      rating: 5,
      userId: { name: 'Ayesha L.' },
      restaurantId: { name: 'Grill House' }
    }
  ];

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await getReviews();
        console.log('Fetched reviews:', response.data);
        if (response.data && response.data.reviews) {
          setReviews(response.data.reviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const settings = {
    dots: true,
    infinite: reviews.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, reviews.length),
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, reviews.length),
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  if (loading) {
    return <div className="review-slider-loading">Loading reviews...</div>;
  }

  if (error) {
    return <div className="review-slider-error">{error}</div>;
  }

  if (!reviews.length) {
    return (
      <section className="review-slider-section">
        <div className="review-slider-container">
          <h2 className="review-slider-title">What Our Customers Say</h2>
          <Slider {...settings} className="review-slider">
            {DUMMY_REVIEWS.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-content">
                  <FaQuoteLeft className="quote-icon" />
                  <p className="review-text">{review.comment}</p>
                  <div className="review-rating">
                    {[...Array(5)].map((_, index) => (
                      <FaStar
                        key={index}
                        className={`star ${index < review.rating ? 'filled' : ''}`}
                      />
                    ))}
                  </div>
                  <div className="review-author">
                    <div className="author-info">
                      <h4>{review.userId?.name || 'Anonymous'}</h4>
                      <p>{review.restaurantId?.name || 'Restaurant'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>
    );
  }

  const limitedReviews = reviews.slice(0, 4);

  return (
    <section className="review-slider-section">
      <div className="review-slider-container">
        <h2 className="review-slider-title">What Our Customers Say</h2>
        <Slider {...settings} className="review-slider">
          {limitedReviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-content">
                <FaQuoteLeft className="quote-icon" />
                <p className="review-text">{review.comment}</p>
                <div className="review-rating">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      className={`star ${index < review.rating ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <div className="review-author">
                  <div className="author-info">
                    <h4>{review.userId?.name || 'Anonymous'}</h4>
                    <p>{review.restaurantId?.name || 'Restaurant'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default ReviewSlider; 