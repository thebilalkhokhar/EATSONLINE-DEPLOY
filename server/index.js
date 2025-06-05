require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const { router: paymentRouter, webhook } = require("./routes/paymentRoutes");

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Set CSP Header
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' https://js.stripe.com https://m.stripe.network blob:https://js.stripe.com blob:https://m.stripe.network; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: https://*.cloudinary.com https://upload.wikimedia.org; " +
      "connect-src 'self' https://api.stripe.com https://m.stripe.network https://eatsonline-f3yo.onrender.com; " +
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com;"
  );
  next();
});

// Configure Stripe webhook route (needs raw body)
app.post("/api/webhook", express.raw({ type: "application/json" }), webhook);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/admin/reports", require("./routes/reports"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api", paymentRouter);
app.use("/api/users", userRoutes);

// Serve static files from the React app (after API routes)
app.use(express.static(path.join(__dirname, "../client/dist")));

// Catch-all handler for React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Fallback for debugging
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" });
});

// MongoDB Connection with Retry and Timeout
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => {
      console.error("MongoDB Connection Error:", err.message);
      console.log("Retrying MongoDB connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Error starting server: ${err.message}`);
    process.exit(1);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
