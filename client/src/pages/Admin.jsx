import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { api, getToken, setToken } from '../api';
import { CATEGORIES, GOALS, STATUSES, inr, useTitle, waLink, when } from '../utils';

export function Login() {
  useTitle('Shop desk');
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@majboot.shop');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken()) navigate('/admin');
  }, [navigate]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/api/admin/login', { method: 'POST', body: { email, password } });
      setToken(result.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <img src="/logo.png" alt="Majboot Protein Shop" />
        <h1>Shop desk</h1>
        <p>Orders, stock and shelf prices.</p>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
        {error && <p className="warn">{error}</p>}
        <button className="btn btn-gold" disabled={busy}>{busy ? 'Checking…' : 'Enter'}</button>
        <p className="fine">Preview login · admin@majboot.shop · Majboot#23532</p>
        <Link to="/">Back to the shop</Link>
      </form>
    </main>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  useTitle('Desk');

  useEffect(() => {
    if (!getToken()) navigate('/admin/login');
  }, [navigate]);

  return (
    <div className="admin-root">
      <aside className="side">
        <Link to="/" className="side-brand">
          <img src="/logo.png" alt="" />
          <span>Majboot desk</span>
        </Link>
        <nav>
          <NavLink end to="/admin">Today</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/products">Shelf</NavLink>
          <NavLink to="/admin/enquiries">Notes</NavLink>
          <NavLink to="/admin/settings">Settings</NavLink>
        </nav>
        <button
          type="button"
          className="text-btn light"
          onClick={() => {
            setToken('');
            navigate('/admin/login');
          }}
        >
          Sign out
        </button>
      </aside>
      <div className="desk">
        <Outlet />
      </div>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/api/admin/overview', { auth: true }).then(setData).catch((err) => setError(err.message));
  }, []);
  if (error) return <p className="warn">{error}</p>;
  if (!data) return <p>Loading the desk…</p>;
  return (
    <div>
      <header className="desk-head">
        <h1>Today</h1>
        <p>Sample orders are marked so a live one is easy to spot. Shelf prices can be edited before you show a customer.</p>
      </header>
      <div className="stats">
        <article><span>Open orders</span><strong>{data.open}</strong></article>
        <article><span>All orders</span><strong>{data.orders}</strong></article>
        <article><span>Taken, not cancelled</span><strong>{inr(data.revenue)}</strong></article>
        <article><span>Unread notes</span><strong>{data.unread}</strong></article>
      </div>
      <div className="desk-grid">
        <section>
          <h2>Recent orders</h2>
          <OrderTable orders={data.recent} />
        </section>
        <section>
          <h2>Running low</h2>
          {data.low.length === 0 && <p>Stock looks comfortable.</p>}
          <ul className="plain">
            {data.low.map((item) => (
              <li key={`${item.productId}-${item.flavour}-${item.weight}`}>
                <Link to={`/admin/products/${item.productId}`}>{item.name}</Link>
                <span>{item.flavour} {item.weight} · {item.stock} left</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function Orders() {
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState('All');
  const [q, setQ] = useState('');
  useEffect(() => {
    api('/api/admin/orders', { auth: true }).then(setOrders);
  }, []);
  const list = (orders || []).filter((order) => {
    if (status !== 'All' && order.status !== status) return false;
    const hay = `${order.code} ${order.customer.name} ${order.customer.phone}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  return (
    <div>
      <header className="desk-head">
        <h1>Orders</h1>
      </header>
      <div className="shop-tools">
        <input className="search" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, mobile or MPS number" />
      </div>
      <div className="chips">
        {['All', ...STATUSES].map((item) => (
          <button key={item} type="button" className={status === item ? 'on' : ''} onClick={() => setStatus(item)}>{item}</button>
        ))}
      </div>
      {!orders ? <p>Loading…</p> : <OrderTable orders={list} />}
    </div>
  );
}

function OrderTable({ orders }) {
  if (!orders?.length) return <p>No orders in this view.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Status</th><th>Pay</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link to={`/admin/orders/${order.id}`}>{order.code}</Link>
                <small>{when(order.createdAt)}{order.sample ? ' · sample' : ''}</small>
              </td>
              <td>{order.customer.name}<small>{order.customer.phone}</small></td>
              <td><span className={`st st-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></td>
              <td>{inr(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('Placed');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api(`/api/admin/orders/${id}`, { auth: true }).then((item) => {
      setOrder(item);
      setStatus(item.status);
      setNote(item.note || '');
    }).catch((err) => setError(err.message));
  }, [id]);

  async function save(event) {
    event.preventDefault();
    setSaved('');
    try {
      const next = await api(`/api/admin/orders/${id}`, { method: 'PATCH', auth: true, body: { status, note } });
      setOrder(next);
      setSaved('Order updated.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !order) return <p className="warn">{error}</p>;
  if (!order) return <p>Loading…</p>;
  const message = `Hello ${order.customer.name}, Majboot Protein Shop here. Order ${order.code} is now ${status}. Total ${inr(order.total)}.`;

  return (
    <div className="order-desk">
      <header className="desk-head">
        <div>
          <p className="eyebrow">{order.sample ? 'Sample order' : 'Live order'}</p>
          <h1>{order.code}</h1>
        </div>
        <a className="btn btn-line" href={waLink(`91${order.customer.phone}`, message)}>WhatsApp customer</a>
      </header>
      <div className="desk-grid">
        <section className="sheet light-sheet">
          <h2>{order.customer.name}</h2>
          <p>{order.customer.phone}{order.customer.email ? ` · ${order.customer.email}` : ''}</p>
          <p>{order.fulfillment === 'pickup' ? 'Counter pickup' : `${order.customer.address}, ${order.customer.city} ${order.customer.pincode}`}</p>
          <p>{when(order.createdAt)} · {order.payment}</p>
          <ul>
            {order.lines.map((line) => (
              <li key={line.variantId}>
                <span>{line.name}<small>{line.flavour} {line.weight} · × {line.qty}</small></span>
                <strong>{inr(line.price * line.qty)}</strong>
              </li>
            ))}
          </ul>
          <p className="due-line"><span>{order.shippingLabel}</span><strong>{inr(order.shipping)}</strong></p>
          <p className="due-line"><span>Total</span><strong>{inr(order.total)}</strong></p>
        </section>
        <form className="form" onSubmit={save}>
          <label>Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <p className="fine">Cancelling puts the stock back. Reopening takes it off the shelf again.</p>
          <label>Note<textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} /></label>
          {error && <p className="warn">{error}</p>}
          {saved && <p className="ok">{saved}</p>}
          <button className="btn btn-ink">Update order</button>
        </form>
      </div>
    </div>
  );
}

export function Products() {
  const [products, setProducts] = useState(null);
  useEffect(() => {
    api('/api/admin/products', { auth: true }).then(setProducts);
  }, []);
  return (
    <div>
      <header className="desk-head">
        <h1>Shelf</h1>
        <Link className="btn btn-ink" to="/admin/products/new">Add a product</Link>
      </header>
      {!products ? <p>Loading…</p> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Shelf</th><th>From</th><th>Stock</th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link to={`/admin/products/${product.id}`}>{product.name}</Link>
                    <small>{product.active ? product.category : 'Hidden'}</small>
                  </td>
                  <td>{product.goal}</td>
                  <td>{inr(Math.min(...product.variants.map((variant) => variant.price)))}</td>
                  <td>{product.variants.reduce((sum, variant) => sum + variant.stock, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const BLANK = {
  name: '', slug: '', category: 'Whey', goal: 'Build', badge: '', tagline: '', description: '', howToUse: '',
  highlights: '', images: '', featured: false, bestseller: false, active: true,
  variants: [{ flavour: '', weight: '', price: '', mrp: '', stock: 10 }],
};

export function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const creating = id === 'new';
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (creating) {
      setForm(BLANK);
      return;
    }
    api('/api/admin/products', { auth: true }).then((products) => {
      const product = products.find((item) => item.id === id);
      if (!product) {
        setError('Product not found.');
        return;
      }
      setForm({
        ...product,
        highlights: (product.highlights || []).join('\n'),
        images: (product.images || []).join('\n'),
        variants: product.variants.map((variant) => ({ ...variant, mrp: variant.mrp ?? '' })),
      });
    });
  }, [id, creating]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function setVariant(index, key, value) {
    setForm((current) => {
      const variants = current.variants.map((variant, item) => (item === index ? { ...variant, [key]: value } : variant));
      return { ...current, variants };
    });
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    setSaved('');
    const body = {
      ...form,
      highlights: form.highlights,
      images: form.images,
      variants: form.variants.map((variant) => ({
        ...variant,
        price: Number(variant.price),
        mrp: variant.mrp === '' ? null : Number(variant.mrp),
        stock: Number(variant.stock),
      })),
    };
    try {
      if (creating) {
        const created = await api('/api/admin/products', { method: 'POST', auth: true, body });
        navigate(`/admin/products/${created.id}`);
      } else {
        const updated = await api(`/api/admin/products/${id}`, { method: 'PUT', auth: true, body });
        setSaved('Saved.');
        setForm({
          ...updated,
          highlights: updated.highlights.join('\n'),
          images: updated.images.join('\n'),
          variants: updated.variants.map((variant) => ({ ...variant, mrp: variant.mrp ?? '' })),
        });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!window.confirm('Remove this product from the shelf?')) return;
    await api(`/api/admin/products/${id}`, { method: 'DELETE', auth: true });
    navigate('/admin/products');
  }

  return (
    <form className="editor" onSubmit={save}>
      <header className="desk-head">
        <h1>{creating ? 'New product' : form.name || 'Product'}</h1>
        <div className="hero-actions">
          {!creating && <button type="button" className="text-btn" onClick={remove}>Remove</button>}
          <button className="btn btn-ink">Save</button>
        </div>
      </header>
      <div className="editor-grid">
        <div className="form">
          <label>Name<input value={form.name} onChange={(event) => set('name', event.target.value)} required /></label>
          <label>Link name<input value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="auto from the name" /></label>
          <div className="split">
            <label>Category<input list="cats" value={form.category} onChange={(event) => set('category', event.target.value)} /></label>
            <label>Goal<input list="goals" value={form.goal} onChange={(event) => set('goal', event.target.value)} /></label>
          </div>
          <datalist id="cats">{CATEGORIES.map((item) => <option key={item} value={item} />)}</datalist>
          <datalist id="goals">{GOALS.map((item) => <option key={item.id} value={item.id} />)}</datalist>
          <label>Short line<input value={form.tagline} onChange={(event) => set('tagline', event.target.value)} /></label>
          <label>Badge<input value={form.badge} onChange={(event) => set('badge', event.target.value)} placeholder="Isolate, High stim…" /></label>
          <label>Description<textarea rows={4} value={form.description} onChange={(event) => set('description', event.target.value)} /></label>
          <label>How to use<textarea rows={3} value={form.howToUse} onChange={(event) => set('howToUse', event.target.value)} /></label>
          <label>Highlights, one per line<textarea rows={4} value={form.highlights} onChange={(event) => set('highlights', event.target.value)} /></label>
          <label>Image links, one per line<textarea rows={3} value={form.images} onChange={(event) => set('images', event.target.value)} /></label>
          <div className="checks">
            <label><input type="checkbox" checked={form.active} onChange={(event) => set('active', event.target.checked)} /> Visible on the shelf</label>
            <label><input type="checkbox" checked={form.featured} onChange={(event) => set('featured', event.target.checked)} /> Forward on the home shelf</label>
            <label><input type="checkbox" checked={form.bestseller} onChange={(event) => set('bestseller', event.target.checked)} /> Counter pick</label>
          </div>
        </div>
        <div>
          <h2>Flavours and sizes</h2>
          {form.variants.map((variant, index) => (
            <div key={variant.id || index} className="variant">
              <input placeholder="Flavour" value={variant.flavour} onChange={(event) => setVariant(index, 'flavour', event.target.value)} />
              <input placeholder="Size" value={variant.weight} onChange={(event) => setVariant(index, 'weight', event.target.value)} />
              <input placeholder="Price" inputMode="numeric" value={variant.price} onChange={(event) => setVariant(index, 'price', event.target.value)} />
              <input placeholder="MRP" inputMode="numeric" value={variant.mrp} onChange={(event) => setVariant(index, 'mrp', event.target.value)} />
              <input placeholder="Stock" inputMode="numeric" value={variant.stock} onChange={(event) => setVariant(index, 'stock', event.target.value)} />
              <button
                type="button"
                className="text-btn"
                onClick={() => set('variants', form.variants.filter((_, item) => item !== index))}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-btn"
            onClick={() => set('variants', [...form.variants, { flavour: '', weight: '', price: '', mrp: '', stock: 10 }])}
          >
            Add a flavour
          </button>
        </div>
      </div>
      {error && <p className="warn">{error}</p>}
      {saved && <p className="ok">{saved}</p>}
    </form>
  );
}

export function Enquiries() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    api('/api/admin/enquiries', { auth: true }).then(setItems);
  }, []);

  async function mark(id) {
    const next = await api(`/api/admin/enquiries/${id}`, { method: 'PATCH', auth: true });
    setItems((current) => current.map((item) => (item.id === id ? next : item)));
  }

  return (
    <div>
      <header className="desk-head"><h1>Notes from the site</h1></header>
      {!items ? <p>Loading…</p> : items.length === 0 ? <p>No notes yet.</p> : (
        <ul className="notes">
          {items.map((item) => (
            <li key={item.id} className={item.read ? 'read' : ''}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.phone}</span>
                <small>{when(item.createdAt)} · {item.id}</small>
              </div>
              <p>{item.message}</p>
              <div className="hero-actions">
                <a href={waLink(`91${item.phone}`, `Hello ${item.name}, Majboot Protein Shop here about your note.`)}>WhatsApp</a>
                {!item.read && <button type="button" className="text-btn" onClick={() => mark(item.id)}>Mark read</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Settings() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api('/api/admin/settings', { auth: true }).then(setForm);
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaved('');
    try {
      setForm(await api('/api/admin/settings', { method: 'PUT', auth: true, body: form }));
      setSaved('Settings saved.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!form) return <p>Loading…</p>;
  const fields = [
    ['announcement', 'Top bar'],
    ['phone', 'Phone shown on the site'],
    ['whatsapp', 'WhatsApp number, digits only'],
    ['instagram', 'Instagram link'],
    ['instagramHandle', 'Instagram handle'],
    ['address', 'Address'],
    ['hours', 'Hours'],
    ['freeShipOver', 'Free delivery over ₹'],
    ['flatShip', 'Delivery charge ₹'],
  ];
  return (
    <form className="form narrow-form" onSubmit={save}>
      <header className="desk-head"><h1>Settings</h1></header>
      {fields.map(([key, label]) => (
        <label key={key}>{label}
          <input value={form[key] ?? ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
        </label>
      ))}
      {error && <p className="warn">{error}</p>}
      {saved && <p className="ok">{saved}</p>}
      <button className="btn btn-ink">Save settings</button>
    </form>
  );
}
