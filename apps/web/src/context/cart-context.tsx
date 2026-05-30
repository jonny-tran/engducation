"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  level: string;
  price: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (course: CartItem) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage once mounted (prevents hydration mismatch)
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("engducation_cart");
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error("Error reading cart from localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes, but only after it's loaded
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("engducation_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Error writing cart to localStorage", e);
    }
  }, [cartItems, isLoaded]);

  const addToCart = (course: CartItem) => {
    setCartItems((prev) => {
      if (prev.some((item) => item.id === course.id)) {
        return prev; // Avoid duplicate
      }
      return [...prev, course];
    });
  };

  const removeFromCart = (courseId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== courseId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (courseId: string) => {
    return cartItems.some((item) => item.id === courseId);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
