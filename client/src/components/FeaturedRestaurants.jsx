import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUtensils } from "react-icons/fa";
import { getRestaurants } from "../services/api";
import styles from "../assets/FeaturedRestaurants.module.css";

const FeaturedRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await getRestaurants();
        const restaurantData = Array.isArray(res.data)
          ? res.data.slice(0, 6)
          : [];
        setRestaurants(restaurantData);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError("Failed to load featured restaurants");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <section className={styles.featuredRestaurants}>
      <div className={styles.featuredRestaurantsContainer}>
        <h2>Explore Top Restaurants</h2>
        <p className={styles.sectionDescription}>
          Discover the best dining experiences in your area
        </p>
        <div className={styles.restaurantsGrid}>
          {restaurants.map((restaurant, index) => {
            const backgroundImage =
              restaurant.logo?.url ||
              "https://via.placeholder.com/300x200?text=Restaurant";
            return (
              <Link
                to={`/menu/${restaurant._id}`}
                key={restaurant._id}
                className={styles.restaurantCard}
                style={{
                  "--restaurant-color": `hsl(${index * 60}, 70%, 60%)`,
                  backgroundImage: `url(${backgroundImage})`,
                }}
              >
                <div className={styles.restaurantOverlay}>
                  <FaUtensils className={styles.restaurantIcon} />
                  <h3>{restaurant.name}</h3>
                  <p className={styles.cuisineType}>
                    {restaurant.cuisineType?.join(", ") || "Various"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className={styles.viewAllContainer}>
          <Link to="/restaurants" className={styles.viewAllButton}>
            View All Restaurants
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedRestaurants;
