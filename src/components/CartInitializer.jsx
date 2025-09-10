// src/components/CartInitializer.jsx
import React, { useEffect } from 'react';
import { useAppStore } from '../lib/store.ts';
import { supabase } from '../lib/supabaseClient.ts';

const CartInitializer = () => {
  const { fetchCart } = useAppStore();

  useEffect(() => {
    let mounted = true;

    // Function to initialize cart for authenticated user
    const initializeCart = async () => {
      try {
        console.log("[CART-INITIALIZER] Checking authentication status...");
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("[CART-INITIALIZER] Error getting user:", error);
          return;
        }

        if (user && mounted) {
          console.log("[CART-INITIALIZER] User authenticated, fetching cart for:", user.id);
          await fetchCart();
          console.log("[CART-INITIALIZER] Cart initialization completed");
        } else {
          console.log("[CART-INITIALIZER] No user authenticated, clearing cart");
          useAppStore.setState({ items: [] });
        }
      } catch (error) {
        console.error("[CART-INITIALIZER] Error during cart initialization:", error);
      }
    };

    // Initialize cart on component mount
    initializeCart();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("[CART-INITIALIZER] Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("[CART-INITIALIZER] User signed in, fetching cart");
        await fetchCart();
      } else if (event === 'SIGNED_OUT') {
        console.log("[CART-INITIALIZER] User signed out, clearing cart");
        useAppStore.setState({ items: [] });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Optionally refetch cart on token refresh to ensure sync
        console.log("[CART-INITIALIZER] Token refreshed, ensuring cart sync");
        await fetchCart();
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchCart]);

  // This component doesn't render anything visible
  return null;
};

export default CartInitializer;