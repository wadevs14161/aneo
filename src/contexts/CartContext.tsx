'use client'
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, getCartItems, addToCart as addToCartAction, removeFromCart as removeFromCartAction } from '@/lib/cart-actions';
import { useAuth } from '@/hooks/useAuth';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
}

interface CartContextType extends CartState {
  addToCart: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (courseId: string) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  refreshCart: () => Promise<void>;
}

type CartAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: true
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ITEMS':
      const items = action.payload;
      return {
        ...state,
        items,
        total: items.reduce((sum, item) => sum + item.price, 0),
        itemCount: items.length,
        loading: false
      };
    
    case 'ADD_ITEM':
      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.price, 0),
        itemCount: newItems.length
      };
    
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.course_id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        total: filteredItems.reduce((sum, item) => sum + item.price, 0),
        itemCount: filteredItems.length
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0
      };
    
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, loading: authLoading } = useAuth();

  const refreshCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const items = await getCartItems();
      dispatch({ type: 'SET_ITEMS', payload: items });
    } catch (error) {
      console.error('Error refreshing cart:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (courseId: string) => {
    const result = await addToCartAction(courseId);
    if (result.success) {
      await refreshCart(); // Refresh to get updated cart
    }
    return result;
  };

  const removeFromCart = async (courseId: string) => {
    const result = await removeFromCartAction(courseId);
    if (result.success) {
      dispatch({ type: 'REMOVE_ITEM', payload: courseId });
    }
    return result;
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const isInCart = (courseId: string) => {
    return state.items.some(item => item.course_id === courseId);
  };

  useEffect(() => {
    // Only load cart when auth is resolved and user is logged in
    if (!authLoading && user) {
      refreshCart();
    } else if (!authLoading && !user) {
      // Clear cart if not authenticated
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [authLoading, user]);

  const value: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}