import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  getProducts,
  getOrders,
  getCategories,
  createRestaurant,
  updateRestaurant,
  getRestaurantDetails,
  getAdminOrders,
  getSalesReport,
  updateOrderStatus,
} from "../../services/api";
import "../../assets/AdminDashboard.css";
import { FaImage } from "react-icons/fa";
import { toast } from "react-toastify";

function Dashboard() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      country: "Pakistan",
      postalCode: "",
    },
    contact: {
      phone: "",
      email: "",
    },
    cuisineType: [],
    deliveryAvailable: false,
    logo: null,
  });
  const [selectedLogo, setSelectedLogo] = useState(null);

  const { user, token, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log("Dashboard loading state:", { loading, error, user }); // Debug
      if (!token || !user || user.role !== "admin") {
        setError("Access denied. Admins only.");
        setLoading(false);
        navigate("/login");
        return;
      }

      if (!user.restaurantId) {
        console.log("No restaurantId for user:", user); // Debug
        setLoading(false);
        return;
      }

      try {
        console.log("User:", user);
        console.log("Restaurant ID:", user.restaurantId);

        const [productsRes, categoriesRes, restaurantRes, ordersRes, salesRes] =
          await Promise.all([
            getProducts(user.restaurantId).catch((err) => {
              console.error("getProducts error:", err);
              return { data: [] };
            }),
            getCategories(user.restaurantId).catch((err) => {
              console.error("getCategories error:", err);
              return { data: [] };
            }),
            getRestaurantDetails(user.restaurantId).catch((err) => {
              console.error("getRestaurantDetails error:", err);
              return { data: null };
            }),
            getAdminOrders(token, user.restaurantId).catch((err) => {
              console.error("getAdminOrders error:", err);
              return { data: [] };
            }),
            getSalesReport({
              restaurantId: user.restaurantId,
              period: "all",
            }).catch((err) => {
              console.error("getSalesReport error:", err);
              return { data: { data: { totalOrders: 0, totalSales: 0 } } };
            }),
          ]);

        console.log("Restaurant API Response:", restaurantRes);
        console.log("Sales Report API Response:", salesRes); // Debug

        setTotalProducts(productsRes.data.length || 0);
        setTotalCategories(categoriesRes.data.length || 0);

        const restaurantData = restaurantRes.data || null;
        if (!restaurantData) {
          console.warn("No restaurant data returned from API");
        }
        setRestaurant(restaurantData);

        const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const recentOrders = ordersData.slice(0, 5);
        setOrders(recentOrders);

        const salesData = salesRes.data.data || {};
        setStats({
          totalOrders: salesData.totalOrders || 0,
          totalSales: salesData.totalSales || 0,
          pendingOrders: Array.isArray(recentOrders)
            ? recentOrders.filter((o) => o.status === "Pending").length
            : 0,
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load dashboard. Please try again."
        );
        console.error("Dashboard fetch error:", err.response || err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token, user, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await updateOrderStatus(orderId, { status: newStatus });
      setOrders(
        orders.map((o) =>
          o._id === orderId ? { ...o, status: res.data.status || newStatus } : o
        )
      );
      toast.success("Order status updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleRestaurantChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "logo" && files && files[0]) {
      const file = files[0];
      setSelectedLogo(file);
      setRestaurantForm((prev) => ({
        ...prev,
        logo: URL.createObjectURL(file),
      }));
      return;
    }

    if (type === "checkbox") {
      setRestaurantForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name.startsWith("address_")) {
      const field = name.split("_")[1];
      setRestaurantForm((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else if (name.startsWith("contact_")) {
      const field = name.split("_")[1];
      let normalizedPhone = value.trim();
      if (field === "phone" && normalizedPhone.length > 0) {
        if (normalizedPhone.startsWith("0")) {
          normalizedPhone = "+92" + normalizedPhone.slice(1);
        } else if (!normalizedPhone.startsWith("+92")) {
          normalizedPhone = "+92" + normalizedPhone;
        }
      }
      setRestaurantForm((prev) => ({
        ...prev,
        contact: { ...prev.contact, [field]: normalizedPhone || value },
      }));
    } else if (name === "cuisineType") {
      const cuisines = value
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      setRestaurantForm((prev) => ({ ...prev, cuisineType: cuisines }));
    } else {
      setRestaurantForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const initializeFormWithRestaurant = () => {
    if (restaurant) {
      setRestaurantForm({
        name: restaurant.name || "",
        address: {
          street: restaurant.address?.street || "",
          city: restaurant.address?.city || "",
          country: restaurant.address?.country || "Pakistan",
          postalCode: restaurant.address?.postalCode || "",
        },
        contact: {
          phone: restaurant.contact?.phone || "",
          email: restaurant.contact?.email || "",
        },
        cuisineType: restaurant.cuisineType || [],
        deliveryAvailable: restaurant.deliveryAvailable || false,
        logo: restaurant.logo?.url || null,
      });
    }
  };

  const handleShowModal = () => {
    if (user.restaurantId) {
      initializeFormWithRestaurant();
    } else {
      setRestaurantForm({
        name: "",
        address: {
          street: "",
          city: "",
          country: "Pakistan",
          postalCode: "",
        },
        contact: {
          phone: "",
          email: "",
        },
        cuisineType: [],
        deliveryAvailable: false,
        logo: null,
      });
    }
    setShowRestaurantModal(true);
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", restaurantForm.name);
      formDataToSend.append("address[street]", restaurantForm.address.street);
      formDataToSend.append("address[city]", restaurantForm.address.city);
      formDataToSend.append("address[country]", restaurantForm.address.country);
      formDataToSend.append(
        "address[postalCode]",
        restaurantForm.address.postalCode
      );
      formDataToSend.append("contact[phone]", restaurantForm.contact.phone);
      formDataToSend.append("contact[email]", restaurantForm.contact.email);
      formDataToSend.append(
        "cuisineType",
        JSON.stringify(restaurantForm.cuisineType)
      );
      formDataToSend.append(
        "deliveryAvailable",
        restaurantForm.deliveryAvailable
      );

      if (selectedLogo) {
        formDataToSend.append("logo", selectedLogo);
      }

      const res = await createRestaurant(formDataToSend);
      console.log("Create Restaurant Response:", res.data); // Debug
      setRestaurant(res.data);
      setUser((prev) => ({ ...prev, restaurantId: res.data._id }));
      setShowRestaurantModal(false);
      setLoading(true);
      toast.success("Restaurant created successfully!");
    } catch (err) {
      console.error("Create restaurant error:", err.response || err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create restaurant"
      );
      toast.error(err.response?.data?.message || "Failed to create restaurant");
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", restaurantForm.name);
      formDataToSend.append("address[street]", restaurantForm.address.street);
      formDataToSend.append("address[city]", restaurantForm.address.city);
      formDataToSend.append("address[country]", restaurantForm.address.country);
      formDataToSend.append(
        "address[postalCode]",
        restaurantForm.address.postalCode
      );
      formDataToSend.append("contact[phone]", restaurantForm.contact.phone);
      formDataToSend.append("contact[email]", restaurantForm.contact.email);
      formDataToSend.append(
        "cuisineType",
        JSON.stringify(restaurantForm.cuisineType)
      );
      formDataToSend.append(
        "deliveryAvailable",
        restaurantForm.deliveryAvailable
      );

      if (selectedLogo) {
        formDataToSend.append("logo", selectedLogo);
      }

      setLoading(true);
      const res = await updateRestaurant(user.restaurantId, formDataToSend);
      setRestaurant(res.data);
      setShowRestaurantModal(false);

      const restaurantRes = await getRestaurantDetails(user.restaurantId);
      setRestaurant(restaurantRes.data);
      setLoading(false);

      toast.success("Restaurant updated successfully!");
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update restaurant"
      );
      toast.error(err.response?.data?.message || "Failed to update restaurant");
    }
  };

  console.log("Dashboard render:", { stats }); // Debug

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard-container">
      <h1>Welcome, {user?.name || "Admin"}!</h1>
      <p className="subtitle">Admin Dashboard</p>

      {user.restaurantId ? (
        <>
          {restaurant && (
            <div className="restaurant-block">
              <div className="stat-card restaurant-stat">
                <h3>Restaurant</h3>
                <p>{restaurant.name || "N/A"}</p>
              </div>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Orders</h3>
              <p>{stats.totalOrders || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Sales</h3>
              <p>PKR {(stats.totalSales || 0).toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Orders</h3>
              <p>{stats.pendingOrders || 0}</p>
            </div>
          </div>

          <div className="nav-links">
            <button onClick={() => navigate("/admin/products")}>
              Manage Products
            </button>
            <button onClick={() => navigate("/admin/categories")}>
              Manage Categories
            </button>
            <button onClick={() => navigate("/admin/orders")}>
              View All Orders
            </button>
            <button onClick={() => navigate("/admin/reports")}>
              Sales Reports
            </button>
          </div>

          <div className="restaurant-info">
            <h2>{restaurant?.name || "Restaurant"}</h2>
            <p>
              Address: {restaurant?.address?.city || "N/A"},{" "}
              {restaurant?.address?.country || "N/A"}
            </p>
            <p>Contact: {restaurant?.contact?.phone || "N/A"}</p>
            <button onClick={handleShowModal}>Update Restaurant</button>
          </div>

          <div className="recent-orders">
            <h2>Recent Orders</h2>
            {orders.length === 0 ? (
              <p>No recent orders</p>
            ) : (
              <div className="orders-table">
                <div className="table-header">
                  <span>Order</span>
                  <span>Date</span>
                  <span>Total</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {orders.map((order) => (
                  <div key={order._id} className="table-row">
                    <span>#{order._id?.slice(-6) || "N/A"}</span>
                    <span>{formatDate(order.createdAt)}</span>
                    <span>PKR {(order.totalPrice || 0).toFixed(2)}</span>
                    <select
                      value={order.status || "Pending"}
                      onChange={(e) =>
                        handleStatusUpdate(order._id, e.target.value)
                      }
                      className={`status ${(order.status || "Pending")
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-restaurant">
          <p>
            You don't have a restaurant yet. Create one to manage your business.
          </p>
          <button onClick={handleShowModal}>Create Restaurant</button>
        </div>
      )}

      {showRestaurantModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>
              {user.restaurantId ? "Update Restaurant" : "Create Restaurant"}
            </h2>
            <form
              onSubmit={
                user.restaurantId
                  ? handleUpdateRestaurant
                  : handleCreateRestaurant
              }
            >
              <div className="form-layout">
                <div className="image-upload">
                  {restaurantForm.logo ? (
                    <div className="image-preview">
                      <img src={restaurantForm.logo} alt="Restaurant Logo" />
                      <button
                        type="button"
                        onClick={() => {
                          setRestaurantForm((prev) => ({
                            ...prev,
                            logo: null,
                          }));
                          setSelectedLogo(null);
                        }}
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-placeholder"
                      onClick={() =>
                        document.getElementById("logo-upload").click()
                      }
                    >
                      <FaImage />
                      <p>Click to upload logo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    onChange={handleRestaurantChange}
                    style={{ display: "none" }}
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="upload-button">
                    {restaurantForm.logo ? "Change Logo" : "Upload Logo"}
                  </label>
                </div>

                <div className="form-fields">
                  <div className="form-group">
                    <label>Restaurant Name</label>
                    <input
                      type="text"
                      name="name"
                      value={restaurantForm.name}
                      onChange={handleRestaurantChange}
                      placeholder="Restaurant Name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      name="address_street"
                      value={restaurantForm.address.street}
                      onChange={handleRestaurantChange}
                      placeholder="Street (Optional)"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="address_city"
                        value={restaurantForm.address.city}
                        onChange={handleRestaurantChange}
                        placeholder="City"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        name="address_country"
                        value={restaurantForm.address.country}
                        onChange={handleRestaurantChange}
                        placeholder="Country"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="address_postalCode"
                      value={restaurantForm.address.postalCode}
                      onChange={handleRestaurantChange}
                      placeholder="Postal Code (Optional)"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        name="contact_phone"
                        value={restaurantForm.contact.phone}
                        onChange={handleRestaurantChange}
                        placeholder="Phone (e.g., 03001234567)"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="contact_email"
                        value={restaurantForm.contact.email}
                        onChange={handleRestaurantChange}
                        placeholder="Email (Optional)"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Cuisine Types</label>
                    <input
                      type="text"
                      name="cuisineType"
                      value={restaurantForm.cuisineType.join(", ")}
                      onChange={handleRestaurantChange}
                      placeholder="Cuisine Types (e.g., Italian, Fast Food)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="deliveryAvailable"
                        checked={restaurantForm.deliveryAvailable}
                        onChange={handleRestaurantChange}
                      />
                      Delivery Available
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit">
                  {user.restaurantId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRestaurantModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
