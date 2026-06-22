import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

const CartContext = createContext();

const LOCAL_KEY = 'cart';

const calcTotals = (items) => {
  const totalItems = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const totalPrice = items.reduce((s, it) => s + (it.quantity || 0) * (it.price || 0), 0);
  return { totalItems, totalPrice };
};

export function CartProvider({ children }) {
  const { user, authReady } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (user) {
          // load server cart
          const res = await api.get('/api/cart');
          const serverItems = Array.isArray(res.data) ? res.data : [];
          setItems(serverItems);

          try {
            const raw = localStorage.getItem(LOCAL_KEY);
            const local = raw ? JSON.parse(raw) : [];
            if (Array.isArray(local) && local.length) {
              await Promise.allSettled(
                local.map((it) => api.post('/api/cart', { productId: it.productId, quantity: it.quantity }))
              );
              const refreshed = await api.get('/api/cart');
              setItems(Array.isArray(refreshed.data) ? refreshed.data : []);
            }
            localStorage.removeItem(LOCAL_KEY);
          } catch (mergeErr) {
            console.warn('Cart merge failed', mergeErr);
            localStorage.removeItem(LOCAL_KEY);
          }
        } else {
          const raw = localStorage.getItem(LOCAL_KEY);
          setItems(raw ? JSON.parse(raw) : []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải giỏ hàng');
      } finally {
        setLoading(false);
      }
    };

    if (authReady) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authReady]);

  const persistLocal = (nextItems) => {
    try {
      if (user) {
        localStorage.removeItem(LOCAL_KEY);
        return;
      }
      localStorage.setItem(LOCAL_KEY, JSON.stringify(nextItems));
    } catch (e) {
      // ignore
    }
  };

  const refreshServerCart = async () => {
    if (!user) return;
    const res = await api.get('/api/cart');
    setItems(Array.isArray(res.data) ? res.data : []);
  };

  const addItem = async ({ productId, name, price }, quantity = 1) => {
    const previousItems = items;
    try {
      setError('');
      const pid = productId || (typeof productId === 'undefined' ? undefined : productId);
      const existingIndex = items.findIndex((it) => String(it.productId) === String(pid) || String(it.productId) === String(productId) );
      let next = [...items];
      if (existingIndex !== -1) {
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
      } else {
        next.push({ productId: pid, name, price, quantity });
      }

      setItems(next);
      persistLocal(next);

      if (user) {
        const res = await api.post('/api/cart', { productId: pid, quantity });
        setItems(Array.isArray(res.data) ? res.data : next);
      }
    } catch (err) {
      setItems(previousItems);
      persistLocal(previousItems);
      if (user) {
        try {
          await refreshServerCart();
        } catch (refreshErr) {
          // keep the rollback state and show the original error
        }
      }
      setError(err.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ');
    }
  };

  const updateItem = async (productId, quantity) => {
    const previousItems = items;
    try {
      setError('');
      let next = [...items];
      const idx = next.findIndex((it) => String(it.productId) === String(productId));
      if (idx === -1) return;
      if (quantity <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], quantity };
      }
      setItems(next);
      persistLocal(next);

      if (user) {
        const res = await api.put('/api/cart', { productId, quantity });
        setItems(Array.isArray(res.data) ? res.data : next);
      }
    } catch (err) {
      setItems(previousItems);
      persistLocal(previousItems);
      if (user) {
        try {
          await refreshServerCart();
        } catch (refreshErr) {
          // keep the rollback state and show the original error
        }
      }
      setError(err.response?.data?.message || 'Không thể cập nhật giỏ hàng');
    }
  };

  const removeItem = async (productId) => {
    const previousItems = items;
    try {
      setError('');
      const next = items.filter((it) => String(it.productId) !== String(productId));
      setItems(next);
      persistLocal(next);
      if (user) {
        const res = await api.delete(`/api/cart/${productId}`);
        setItems(Array.isArray(res.data) ? res.data : next);
      }
    } catch (err) {
      setItems(previousItems);
      persistLocal(previousItems);
      if (user) {
        try {
          await refreshServerCart();
        } catch (refreshErr) {
          // keep the rollback state and show the original error
        }
      }
      setError(err.response?.data?.message || 'Không thể xóa item');
    }
  };

  const clearCart = async () => {
    try {
      setItems([]);
      persistLocal([]);
      if (user) {
        const server = await api.get('/api/cart');
        const serverItems = Array.isArray(server.data) ? server.data : [];
        await Promise.all(serverItems.map((it) => api.delete(`/api/cart/${it.productId}`)));
      }
    } catch (err) {
      
    }
  };

  const totals = calcTotals(items);

  return (
    <CartContext.Provider value={{ items, loading, error, addItem, updateItem, removeItem, clearCart, ...totals }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

export default CartContext;
