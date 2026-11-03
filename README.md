# Majboot Protein Shop

Storefront, checkout, and shop desk for Majboot Protein Shop, Karale Layout, Buldhana. Built with React and Express. Product data lives in a JSON file so the demo runs without MongoDB. Orders, stock, and price edits persist in `server/data/store.json`.

## Run

```bash
npm run install:all
npm run dev
```

Shop: http://localhost:5173  
Desk: http://localhost:5173/admin

Preview login: `admin@majboot.shop` / `Majboot#23532`

Reset the shelf back to sample products and sample orders:

```bash
npm run reseed
```

## What is included

- Home, shelf with search and filters, product pages with flavour and size
- Bag, cash-on-delivery checkout, counter pickup, order tracking
- WhatsApp handoff so the shop can receive an order on the phone they already use
- Admin for orders, stock, prices, customer notes, and shop settings

Delivery is free in Buldhana (and 443 pincodes) and on orders over ₹2,499. Other towns are ₹99. Both numbers can be changed in the desk settings.

Sample order for tracking: `MPS-1004` with mobile `8899001122`.
