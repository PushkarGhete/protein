import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useSettings } from '../context';
import { inr, useTitle, waLink, when } from '../utils';

const STEPS = ['Placed', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered'];

export function Order() {
  const { code } = useParams();
  const settings = useSettings();
  const [order, setOrder] = useState(null);
  useTitle(code || 'Order');

  useEffect(() => {
    const saved = sessionStorage.getItem('majboot-last-order');
    if (!saved) {
      setOrder(null);
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setOrder(parsed.code === code ? parsed : null);
    } catch {
      setOrder(null);
    }
  }, [code]);

  if (!order) {
    return (
      <main className="wrap page narrow">
        <h1>Find this order</h1>
        <p>Enter the mobile number used on {code}.</p>
        <TrackForm initialCode={code} onFound={setOrder} />
      </main>
    );
  }

  const step = order.status === 'Cancelled' ? -1 : STEPS.indexOf(order.status);
  const text = `Majboot order ${order.code} for ${order.customer.name}. Total ${inr(order.total)}. ${order.fulfillment === 'pickup' ? 'Pickup' : order.customer.address}.`;

  return (
    <main className="wrap page narrow">
      <p className="eyebrow">{order.status === 'Cancelled' ? 'Cancelled' : 'Order received'}</p>
      <h1>{order.code}</h1>
      <p className="lede">
        {order.fulfillment === 'pickup'
          ? 'Hold this number when you come to the counter.'
          : 'The shop will confirm on your mobile. Pay cash when it arrives.'}
      </p>
      {order.status !== 'Cancelled' && (
        <ol className="steps">
          {STEPS.map((label, index) => (
            <li key={label} className={index <= step ? 'done' : ''}>
              {label}
            </li>
          ))}
        </ol>
      )}
      <article className="sheet">
        <p>{when(order.createdAt)}</p>
        <h2>{order.customer.name}</h2>
        <p>{order.customer.phone}</p>
        <p>{order.fulfillment === 'pickup' ? `Pickup · ${settings.address}` : `${order.customer.address}, ${order.customer.city} ${order.customer.pincode}`}</p>
        <ul>
          {order.lines.map((line) => (
            <li key={line.variantId}>
              <span>
                {line.name}
                <small>
                  {line.flavour}
                  {line.weight ? ` · ${line.weight}` : ''} · × {line.qty}
                </small>
              </span>
              <strong>{inr(line.price * line.qty)}</strong>
            </li>
          ))}
        </ul>
        <p className="due-line">
          <span>To pay · {order.payment}</span>
          <strong>{inr(order.total)}</strong>
        </p>
      </article>
      <div className="hero-actions">
        <a className="btn btn-gold" href={waLink(settings.whatsapp, text)}>Send this to the shop</a>
        <Link className="btn btn-line" to="/shop">Keep browsing</Link>
      </div>
    </main>
  );
}

export function Track() {
  useTitle('Track an order');
  const [order, setOrder] = useState(null);
  return (
    <main className="wrap page narrow">
      <p className="eyebrow">Order status</p>
      <h1>Track a bag</h1>
      <p>Use the order number and the same mobile you checked out with.</p>
      {order ? (
        <TrackResult order={order} again={() => setOrder(null)} />
      ) : (
        <TrackForm onFound={setOrder} />
      )}
      <p className="fine">Preview sample: MPS-1004 with mobile 8899001122.</p>
    </main>
  );
}

function TrackForm({ onFound, initialCode = '' }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const params = new URLSearchParams({ code, phone });
      onFound(await api(`/api/orders/track?${params}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Order number<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="MPS-1004" required /></label>
      <label>Mobile<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="numeric" required /></label>
      {error && <p className="warn">{error}</p>}
      <button className="btn btn-ink" disabled={busy}>{busy ? 'Looking…' : 'Show status'}</button>
    </form>
  );
}

function TrackResult({ order, again }) {
  return (
    <article className="sheet">
      <p className="eyebrow">{order.status}</p>
      <h2>{order.code}</h2>
      <p>{when(order.createdAt)} · {order.fulfillment === 'pickup' ? 'Counter pickup' : 'Delivery'}</p>
      <ul>
        {order.lines.map((line) => (
          <li key={line.variantId}>
            <span>{line.name}<small>{line.flavour} {line.weight} · × {line.qty}</small></span>
            <strong>{inr(line.price * line.qty)}</strong>
          </li>
        ))}
      </ul>
      <p className="due-line"><span>To pay</span><strong>{inr(order.total)}</strong></p>
      <button type="button" className="text-btn" onClick={again}>Track another</button>
    </article>
  );
}
