import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Qty } from '../components/Chrome';
import { useCart, useSettings } from '../context';
import { inr, useTitle } from '../utils';

const EMPTY = { name: '', phone: '', email: '', address: '', city: 'Buldhana', pincode: '', note: '', fulfillment: 'delivery' };

export function Checkout() {
  useTitle('Checkout');
  const cart = useCart();
  const settings = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cart.items.length) {
      setQuote(null);
      return;
    }
    const handle = setTimeout(() => {
      api('/api/quote', {
        method: 'POST',
        body: {
          items: cart.items.map((item) => ({ productId: item.productId, variantId: item.variantId, qty: item.qty })),
          fulfillment: form.fulfillment,
          city: form.city,
          pincode: form.pincode,
        },
      })
        .then((next) => {
          setQuote(next);
          setError('');
        })
        .catch((err) => {
          setQuote(null);
          setError(err.message);
        });
    }, 250);
    return () => clearTimeout(handle);
  }, [cart.items, form.fulfillment, form.city, form.pincode]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function place(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const order = await api('/api/orders', {
        method: 'POST',
        body: {
          ...form,
          items: cart.items.map((item) => ({ productId: item.productId, variantId: item.variantId, qty: item.qty })),
        },
      });
      cart.clear();
      sessionStorage.setItem('majboot-last-order', JSON.stringify(order));
      navigate(`/order/${order.code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!cart.items.length) {
    return (
      <main className="wrap page">
        <h1>The bag is empty</h1>
        <p>Add a tub from the shelf, then come back to place the order.</p>
        <Link className="btn btn-ink" to="/shop">Open the shelf</Link>
      </main>
    );
  }

  return (
    <main className="wrap page">
      <p className="back-link"><Link to="/shop">← Continue shopping</Link></p>
      <header className="page-head">
        <p className="eyebrow">Checkout</p>
        <h1>Delivery details</h1>
      </header>
      <div className="check">
        <form onSubmit={place} className="form">
          <div className="switch">
            <button type="button" className={form.fulfillment === 'delivery' ? 'on' : ''} onClick={() => set('fulfillment', 'delivery')}>
              Deliver
            </button>
            <button type="button" className={form.fulfillment === 'pickup' ? 'on' : ''} onClick={() => set('fulfillment', 'pickup')}>
              Pick up
            </button>
          </div>
          <p className="fine">
            {form.fulfillment === 'pickup'
              ? `Collect from ${settings.address}. ${settings.hours}.`
              : `Free in Buldhana. ${inr(settings.flatShip)} to other towns, and free anywhere over ${inr(settings.freeShipOver)}.`}
          </p>
          <label>Name<input required value={form.name} onChange={(event) => set('name', event.target.value)} autoComplete="name" /></label>
          <label>Mobile<input required inputMode="numeric" value={form.phone} onChange={(event) => set('phone', event.target.value)} autoComplete="tel" placeholder="10-digit mobile" /></label>
          <label>Email, if you want a copy<input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} autoComplete="email" /></label>
          {form.fulfillment === 'delivery' && (
            <>
              <label>Address<textarea required value={form.address} onChange={(event) => set('address', event.target.value)} autoComplete="street-address" rows={3} /></label>
              <div className="split">
                <label>City<input required value={form.city} onChange={(event) => set('city', event.target.value)} autoComplete="address-level2" /></label>
                <label>Pincode<input required inputMode="numeric" value={form.pincode} onChange={(event) => set('pincode', event.target.value)} autoComplete="postal-code" /></label>
              </div>
            </>
          )}
          <label>Note for the shop<textarea value={form.note} onChange={(event) => set('note', event.target.value)} rows={2} placeholder="Landmark, flavour hold, call on arrival" /></label>
          {error && <p className="warn">{error}</p>}
          <button className="btn btn-ink wide" disabled={busy} type="submit">
            {busy ? 'Placing…' : `Place order · ${quote ? inr(quote.total) : inr(cart.subtotal)}`}
          </button>
        </form>

        <aside className="receipt">
          <h2>Order summary</h2>
          <ul>
            {cart.items.map((item) => (
              <li key={item.variantId}>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {item.flavour}
                    {item.weight ? ` · ${item.weight}` : ''}
                  </p>
                  <Qty value={item.qty} max={Math.min(20, item.stock || 20)} onChange={(qty) => cart.setQty(item.variantId, qty)} />
                </div>
                <em>{inr(item.price * item.qty)}</em>
              </li>
            ))}
          </ul>
          <dl>
            <div><dt>Subtotal</dt><dd>{inr(quote?.subtotal ?? cart.subtotal)}</dd></div>
            <div><dt>{quote?.shippingLabel || 'Delivery'}</dt><dd>{quote ? inr(quote.shipping) : '—'}</dd></div>
            <div className="due"><dt>To pay</dt><dd>{quote ? inr(quote.total) : '—'}</dd></div>
          </dl>
          <p>Pay cash on delivery, or at the counter. No advance.</p>
        </aside>
      </div>
    </main>
  );
}
