import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initStore, read, update } from './store.js';

const PORT = process.env.PORT || 5050;
const SECRET = process.env.JWT_SECRET || 'majboot-demo-secret';
const STATUSES = ['Placed', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];

initStore();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    req.admin = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sign in again.' });
  }
}

function isLocal(city, pincode) {
  const name = String(city || '').toLowerCase();
  const pin = String(pincode || '');
  return name.includes('buldhana') || name.includes('buldana') || pin.startsWith('443');
}

function buildQuote(db, body) {
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) throw fail(400, 'Your bag is empty.');

  const lines = items.map((item) => {
    const product = db.products.find((entry) => entry.id === item.productId && entry.active !== false);
    if (!product) throw fail(400, 'A product in your bag is no longer on the shelf.');
    const variant = product.variants.find((entry) => entry.id === item.variantId);
    if (!variant) throw fail(400, `${product.name} has changed. Remove it and add it again.`);
    const qty = Math.floor(Number(item.qty));
    if (!qty || qty < 1 || qty > 20) throw fail(400, 'Choose a quantity between 1 and 20.');
    if (variant.stock < qty) {
      const label = `${product.name} · ${variant.flavour}${variant.weight ? ` ${variant.weight}` : ''}`;
      throw fail(400, variant.stock > 0 ? `Only ${variant.stock} left of ${label}.` : `${label} is sold out.`);
    }
    return {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      slug: product.slug,
      flavour: variant.flavour,
      weight: variant.weight,
      price: variant.price,
      qty,
      image: variant.image || product.images[0] || '',
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'delivery';
  let shipping = 0;
  let shippingLabel = 'Counter pickup';
  if (fulfillment === 'delivery') {
    const local = isLocal(body.city, body.pincode);
    if (local || subtotal >= db.settings.freeShipOver) {
      shipping = 0;
      shippingLabel = local ? 'Free in Buldhana' : `Free over ₹${db.settings.freeShipOver.toLocaleString('en-IN')}`;
    } else {
      shipping = db.settings.flatShip;
      shippingLabel = 'Delivery';
    }
  }
  return { lines, subtotal, shipping, shippingLabel, total: subtotal + shipping, fulfillment };
}

function cleanProduct(input, existing) {
  const name = String(input.name || '').trim();
  if (name.length < 2) throw fail(400, 'Product needs a name.');
  const slug = String(input.slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (!slug) throw fail(400, 'Product needs a link name.');
  const source = Array.isArray(input.variants) ? input.variants : [];
  const variants = source.map((variant, index) => ({
    id: variant.id || `${slug}-${index + 1}-${Math.random().toString(36).slice(2, 6)}`,
    flavour: String(variant.flavour || 'Original').trim(),
    weight: String(variant.weight || '').trim(),
    price: Math.max(0, Math.round(Number(variant.price) || 0)),
    mrp: variant.mrp === '' || variant.mrp == null ? null : Math.max(0, Math.round(Number(variant.mrp) || 0)),
    stock: Math.max(0, Math.round(Number(variant.stock) || 0)),
    image: variant.image || null,
  }));
  if (!variants.length) throw fail(400, 'Add at least one flavour and size.');
  const list = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  };
  return {
    id: existing?.id || slug,
    slug,
    brand: 'Legendary Sports Nutrition',
    name,
    category: String(input.category || 'Whey').trim(),
    goal: String(input.goal || 'Build').trim(),
    badge: String(input.badge || '').trim(),
    tagline: String(input.tagline || '').trim(),
    description: String(input.description || '').trim(),
    howToUse: String(input.howToUse || '').trim(),
    highlights: list(input.highlights),
    images: list(input.images),
    featured: Boolean(input.featured),
    bestseller: Boolean(input.bestseller),
    active: input.active !== false,
    variants,
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/settings', (_req, res) => res.json(read().settings));

app.get('/api/products', (_req, res) => {
  res.json(read().products.filter((product) => product.active !== false));
});

app.get('/api/products/:slug', (req, res) => {
  const product = read().products.find((item) => item.slug === req.params.slug && item.active !== false);
  if (!product) return res.status(404).json({ error: 'Not on the shelf.' });
  res.json(product);
});

app.post('/api/quote', (req, res) => {
  try {
    res.json(buildQuote(read(), req.body || {}));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
    const email = String(body.email || '').trim();
    const fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'delivery';
    const address = String(body.address || '').trim();
    const city = String(body.city || '').trim();
    const pincode = String(body.pincode || '').trim();
    if (name.length < 2) return res.status(400).json({ error: 'Add the name for the order.' });
    if (phone.length !== 10) return res.status(400).json({ error: 'Enter a 10-digit mobile number.' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'That email does not look right.' });
    }
    if (fulfillment === 'delivery') {
      if (address.length < 4) return res.status(400).json({ error: 'Add the delivery address.' });
      if (city.length < 2) return res.status(400).json({ error: 'Add the city.' });
      if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ error: 'Enter a 6-digit pincode.' });
    }

    const order = await update((db) => {
      const quote = buildQuote(db, { ...body, fulfillment, city, pincode });
      for (const line of quote.lines) {
        const product = db.products.find((item) => item.id === line.productId);
        const variant = product.variants.find((item) => item.id === line.variantId);
        variant.stock -= line.qty;
      }
      const code = `MPS-${db.meta.nextOrder++}`;
      const next = {
        id: code,
        code,
        createdAt: new Date().toISOString(),
        status: 'Placed',
        sample: false,
        fulfillment,
        customer: {
          name,
          phone,
          email,
          address: fulfillment === 'pickup' ? db.settings.address : address,
          city: fulfillment === 'pickup' ? 'Buldhana' : city,
          pincode: fulfillment === 'pickup' ? '443001' : pincode,
        },
        lines: quote.lines,
        subtotal: quote.subtotal,
        shipping: quote.shipping,
        shippingLabel: quote.shippingLabel,
        total: quote.total,
        note: String(body.note || '').trim().slice(0, 400),
        payment: 'Cash on delivery',
      };
      db.orders.unshift(next);
      return next;
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Could not place the order.' });
  }
});

app.get('/api/orders/track', (req, res) => {
  const phone = String(req.query.phone || '').replace(/\D/g, '').slice(-10);
  const code = String(req.query.code || '').trim().toUpperCase();
  const order = read().orders.find((item) => item.code.toUpperCase() === code && item.customer.phone === phone);
  if (!order) return res.status(404).json({ error: 'No order with that number and mobile.' });
  res.json(order);
});

app.post('/api/enquiries', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const phone = String(req.body?.phone || '').replace(/\D/g, '').slice(-10);
  const message = String(req.body?.message || '').trim();
  if (name.length < 2 || phone.length !== 10 || message.length < 4) {
    return res.status(400).json({ error: 'Name, mobile, and a short message are needed.' });
  }
  const enquiry = await update((db) => {
    const item = {
      id: `ENQ-${db.meta.nextEnquiry++}`,
      name,
      phone,
      message: message.slice(0, 800),
      createdAt: new Date().toISOString(),
      read: false,
    };
    db.enquiries.unshift(item);
    return item;
  });
  res.status(201).json({ id: enquiry.id });
});

app.post('/api/admin/login', (req, res) => {
  const db = read();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (email !== db.admin.email || !bcrypt.compareSync(password, db.admin.passwordHash)) {
    return res.status(401).json({ error: 'Those details do not match the counter login.' });
  }
  res.json({ token: jwt.sign({ email }, SECRET, { expiresIn: '12h' }), email });
});

app.get('/api/admin/overview', auth, (_req, res) => {
  const db = read();
  const open = db.orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status));
  const revenue = db.orders
    .filter((order) => order.status !== 'Cancelled')
    .reduce((sum, order) => sum + order.total, 0);
  const low = [];
  for (const product of db.products) {
    for (const variant of product.variants) {
      if (variant.stock <= 6) {
        low.push({
          productId: product.id,
          name: product.name,
          flavour: variant.flavour,
          weight: variant.weight,
          stock: variant.stock,
        });
      }
    }
  }
  res.json({
    orders: db.orders.length,
    open: open.length,
    revenue,
    products: db.products.length,
    unread: db.enquiries.filter((item) => !item.read).length,
    recent: db.orders.slice(0, 6),
    low: low.slice(0, 8),
  });
});

app.get('/api/admin/products', auth, (_req, res) => res.json(read().products));
app.get('/api/admin/orders', auth, (_req, res) => res.json(read().orders));
app.get('/api/admin/orders/:id', auth, (req, res) => {
  const order = read().orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

app.patch('/api/admin/orders/:id', auth, async (req, res) => {
  try {
    const order = await update((db) => {
      const current = db.orders.find((item) => item.id === req.params.id);
      if (!current) throw fail(404, 'Order not found.');
      const next = req.body?.status;
      if (next && !STATUSES.includes(next)) throw fail(400, 'Unknown status.');
      if (next && next !== current.status) {
        const wasCancelled = current.status === 'Cancelled';
        const nowCancelled = next === 'Cancelled';
        if (nowCancelled && !wasCancelled) {
          for (const line of current.lines) {
            const variant = db.products
              .find((item) => item.id === line.productId)
              ?.variants.find((item) => item.id === line.variantId);
            if (variant) variant.stock += line.qty;
          }
        }
        if (wasCancelled && !nowCancelled) {
          for (const line of current.lines) {
            const variant = db.products
              .find((item) => item.id === line.productId)
              ?.variants.find((item) => item.id === line.variantId);
            if (!variant || variant.stock < line.qty) throw fail(400, 'Not enough stock to reopen this order.');
            variant.stock -= line.qty;
          }
        }
        current.status = next;
        current.updatedAt = new Date().toISOString();
      }
      if (typeof req.body?.note === 'string') current.note = req.body.note.slice(0, 400);
      return current;
    });
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/admin/products', auth, async (req, res) => {
  try {
    const created = await update((db) => {
      const product = cleanProduct(req.body || {});
      if (db.products.some((item) => item.slug === product.slug)) throw fail(400, 'That link name is already used.');
      db.products.unshift(product);
      return product;
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.put('/api/admin/products/:id', auth, async (req, res) => {
  try {
    const updated = await update((db) => {
      const index = db.products.findIndex((item) => item.id === req.params.id);
      if (index < 0) throw fail(404, 'Product not found.');
      const product = cleanProduct(req.body || {}, db.products[index]);
      if (db.products.some((item) => item.slug === product.slug && item.id !== db.products[index].id)) {
        throw fail(400, 'That link name is already used.');
      }
      product.id = db.products[index].id;
      db.products[index] = product;
      return product;
    });
    res.json(updated);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.delete('/api/admin/products/:id', auth, async (req, res) => {
  await update((db) => {
    db.products = db.products.filter((item) => item.id !== req.params.id);
  });
  res.json({ ok: true });
});

app.get('/api/admin/enquiries', auth, (_req, res) => res.json(read().enquiries));

app.patch('/api/admin/enquiries/:id', auth, async (req, res) => {
  const item = await update((db) => {
    const enquiry = db.enquiries.find((entry) => entry.id === req.params.id);
    if (enquiry) enquiry.read = true;
    return enquiry;
  });
  if (!item) return res.status(404).json({ error: 'Message not found.' });
  res.json(item);
});

app.get('/api/admin/settings', auth, (_req, res) => res.json(read().settings));

app.put('/api/admin/settings', auth, async (req, res) => {
  const settings = await update((db) => {
    const current = db.settings;
    const body = req.body || {};
    if (body.announcement != null) current.announcement = String(body.announcement).slice(0, 180);
    if (body.phone != null) current.phone = String(body.phone).slice(0, 30);
    if (body.whatsapp != null) current.whatsapp = String(body.whatsapp).replace(/\D/g, '').slice(0, 15);
    if (body.instagram != null) current.instagram = String(body.instagram).slice(0, 200);
    if (body.instagramHandle != null) current.instagramHandle = String(body.instagramHandle).slice(0, 40);
    if (body.address != null) current.address = String(body.address).slice(0, 180);
    if (body.hours != null) current.hours = String(body.hours).slice(0, 140);
    if (body.freeShipOver != null) current.freeShipOver = Math.max(0, Math.round(Number(body.freeShipOver) || 0));
    if (body.flatShip != null) current.flatShip = Math.max(0, Math.round(Number(body.flatShip) || 0));
    return current;
  });
  res.json(settings);
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Majboot API  http://localhost:${PORT}`);
});
