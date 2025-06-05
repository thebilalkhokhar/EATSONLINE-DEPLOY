import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { getCart } from "../services/api";
import { toast } from "react-toastify";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const { token, isAuthenticated } = useContext(AuthContext);

  const fetchCart = async () => {
    if (!isAuthenticated || !token) {
      setCartItems([]);
      setCartCount(0);
      return;
    }

    try {
      const res = await getCart(token);
      console.log("Cart API Response:", res.data); // Debug log
      const items = res.data?.cart?.items || [];
      setCartItems(items);
      const totalQuantity = items.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );
      setCartCount(totalQuantity);
    } catch (err) {
      console.error("Error fetching cart:", err.response || err);
      setCartItems([]);
      setCartCount(0);
      toast.error(err.response?.data?.message || "Failed to load cart");
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, token]);

  const value = {
    cartItems,
    cartCount,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
