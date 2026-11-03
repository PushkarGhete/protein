import { useEffect } from 'react';

export const CATEGORIES = ['Whey', 'Gainers', 'Pre-Workout', 'Creatine', 'Aminos', 'Energy'];

export const GOALS = [
  { id: 'Build', line: 'Size and strength', text: 'Whey and gainers for people adding weight to the bar.' },
  { id: 'Cut', line: 'Lean and tight', text: 'Isolate, with no added sugar, for a stricter phase.' },
  { id: 'Perform', line: 'The session itself', text: 'Pre-workout, creatine, and pump support.' },
  { id: 'Recover', line: 'After the last set', text: 'BCAA, EAA and glutamine for the hours that follow.' },
  { id: 'Hydrate', line: 'Without the buzz', text: 'A caffeine-free drink for sweat and long sessions.' },
];

export const STATUSES = ['Placed', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];

export function inr(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function fromPrice(product) {
  return Math.min(...product.variants.map((variant) => variant.price));
}

export function cheapest(product) {
  return [...product.variants].sort((a, b) => a.price - b.price)[0];
}

export function savePct(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round((1 - price / mrp) * 100);
}

export function flavourCount(product) {
  return new Set(product.variants.map((variant) => variant.flavour)).size;
}

export function defaultVariant(product) {
  return product.variants.find((variant) => variant.stock > 0) || product.variants[0];
}

export function waLink(phone, text) {
  const digits = String(phone || '919370523532').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function telLink(phone) {
  return `tel:+${String(phone || '').replace(/\D/g, '')}`;
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Majboot Protein Shop` : 'Majboot Protein Shop';
  }, [title]);
}

export function when(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
