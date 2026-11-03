import { useState } from 'react';
import { api } from '../api';
import { useSettings } from '../context';
import { telLink, useTitle, waLink } from '../utils';

export function Counter() {
  useTitle('The counter');
  const settings = useSettings();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/api/enquiries', { method: 'POST', body: form });
      setSent(result.id);
      setForm({ name: '', phone: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <section className="wrap page">
        <p className="eyebrow">Majboot Protein Shop</p>
        <h1 className="display">A counter in Karale Layout. A shelf you can order from.</h1>
        <div className="about-grid">
          <p>
            Majboot is a retail supplement shop in Buldhana and an authorised distributor of Legendary Sports Nutrition. The website is the same shelf: you browse the tubs, choose a flavour and size, and either collect them or have them delivered.
          </p>
          <p>
            Prices on this shelf are the shop’s selling prices. Stock moves when an order is placed, and the counter can change a price, hide a tub, or mark an order packed from the shop desk.
          </p>
        </div>
      </section>
      <section className="promises slim-band">
        <div className="wrap promise-grid">
          <article>
            <h3>Where</h3>
            <p>{settings.address}</p>
          </article>
          <article>
            <h3>Hours</h3>
            <p>{settings.hours}</p>
          </article>
          <article>
            <h3>Phone</h3>
            <p><a href={telLink(settings.whatsapp)}>{settings.phone}</a></p>
          </article>
        </div>
      </section>
      <section className="wrap page check">
        <div>
          <h2>Send a note</h2>
          <p>It lands on the shop desk. For a faster reply, WhatsApp is usually quicker.</p>
          {sent ? (
            <p className="quiet-line">Received. The counter has your note ({sent}).</p>
          ) : (
            <form className="form" onSubmit={submit}>
              <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Mobile<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <label>Message<textarea required rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>
              {error && <p className="warn">{error}</p>}
              <button className="btn btn-ink" disabled={busy}>{busy ? 'Sending…' : 'Send to the counter'}</button>
            </form>
          )}
          <div className="hero-actions">
            <a className="btn btn-line" href={waLink(settings.whatsapp, 'Hello Majboot Protein Shop.')}>WhatsApp</a>
            <a className="btn btn-line" href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <a className="btn btn-line" href={map} target="_blank" rel="noreferrer">Open the map</a>
          </div>
        </div>
        <a className="map-card" href={map} target="_blank" rel="noreferrer">
          <span>Map</span>
          <strong>Karale Layout</strong>
          <em>Buldhana, Maharashtra</em>
          <small>Open in Google Maps</small>
        </a>
      </section>
    </main>
  );
}
