import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const CartContext = createContext(null);
const ToastContext = createContext(null);
const SettingsContext = createContext(null);

const BAG = 'majboot-bag';
const FALLBACK = {
  announcement: 'Authorised Legendary Sports Nutrition counter · Karale Layout, Buldhana',
  phone: '+91 93705 23532',
  whatsapp: '919370523532',
  instagram: 'https://www.instagram.com/majboot_protein',
  instagramHandle: '@majboot_protein',
  address: 'Karale Layout, Buldhana, Maharashtra',
  hours: 'Ask on WhatsApp for today’s counter timing',
  freeShipOver: 2499,
  flatShip: 99,
};

export function AppState({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(BAG)) || [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState(FALLBACK);

  useEffect(() => {
    localStorage.setItem(BAG, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    api('/api/settings').then(setSettings).catch(() => {});
  }, []);

  const toast = (message) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 2800);
  };

  const cart = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return {
      items,
      open,
      setOpen,
      count,
      subtotal,
      add(product, variant, qty = 1) {
        setItems((current) => {
          const index = current.findIndex((item) => item.variantId === variant.id);
          if (index >= 0) {
            const next = [...current];
            next[index] = { ...next[index], qty: Math.min(variant.stock || 20, next[index].qty + qty) };
            return next;
          }
          return [
            ...current,
            {
              productId: product.id,
              variantId: variant.id,
              slug: product.slug,
              name: product.name,
              flavour: variant.flavour,
              weight: variant.weight,
              price: variant.price,
              image: variant.image || product.images?.[0] || '',
              qty,
              stock: variant.stock,
            },
          ];
        });
        setOpen(true);
      },
      setQty(variantId, qty) {
        setItems((current) =>
          current
            .map((item) => (item.variantId === variantId ? { ...item, qty } : item))
            .filter((item) => item.qty > 0)
        );
      },
      remove(variantId) {
        setItems((current) => current.filter((item) => item.variantId !== variantId));
      },
      clear() {
        setItems([]);
      },
    };
  }, [items, open]);

  return (
    <SettingsContext.Provider value={settings}>
      <ToastContext.Provider value={toast}>
        <CartContext.Provider value={cart}>
          {children}
          <div className="toasts" aria-live="polite">
            {toasts.map((item) => (
              <p key={item.id}>{item.message}</p>
            ))}
          </div>
        </CartContext.Provider>
      </ToastContext.Provider>
    </SettingsContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

export function useToast() {
  return useContext(ToastContext);
}

export function useSettings() {
  return useContext(SettingsContext);
}
