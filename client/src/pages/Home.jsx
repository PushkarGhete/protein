import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ProductCard } from '../components/ProductCard';
import { Pack } from '../components/Chrome';
import { useSettings } from '../context';
import { fromPrice, inr, telLink, useTitle, waLink } from '../utils';

const STAGES = [
  { category: 'Whey', slug: 'iso-90', line: 'Lean protein' },
  { category: 'Gainers', slug: 'massive-muscle', line: 'Hard gainers' },
  { category: 'Pre-Workout', slug: 'overdose-preworkout', line: 'The session' },
  { category: 'Creatine', slug: 'creatine', line: 'Daily strength' },
  { category: 'Aminos', slug: 'ultimate-bcaa', line: 'Recovery' },
];

const FAVOURITES = ['iso-90', 'nitro-whey', 'massive-muscle', 'creatine'];

export function Home() {
  useTitle('');
  const settings = useSettings();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/products')
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  const bySlug = (slug) => products?.find((item) => item.slug === slug);
  const tubs = ['iso-90', 'nitro-whey', 'build-whey', 'massive-muscle', 'creatine'].map(bySlug).filter(Boolean);
  const favourites = FAVOURITES.map(bySlug).filter(Boolean);

  return (
    <main>
      <section className="hero-dark">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow light">Authorised Legendary Sports Nutrition</p>
            <h1>
              Fuel the
              <span> grind.</span>
            </h1>
            <p className="lede light">
              Genuine tubs from the Karale Layout counter. Whey, gainers, creatine and pre-workout, delivered in Buldhana or picked up the same day.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-gold" to="/shop">Shop products</Link>
              <Link className="btn btn-line light" to="/counter">Visit the counter</Link>
            </div>
            <dl className="hero-stats">
              <div><dt>100%</dt><dd>Authentic tubs</dd></div>
              <div><dt>COD</dt><dd>Pay on delivery</dd></div>
              <div><dt>{inr(settings.freeShipOver)}</dt><dd>Free delivery over</dd></div>
            </dl>
          </div>
          <div className="hero-mark">
            <img src="/logo.png" alt="Majboot Protein Shop" />
          </div>
        </div>
        {tubs.length > 0 && (
          <div className="wrap tub-row">
            {tubs.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`}>
                <Pack src={product.images[0]} alt="" />
                <strong>{product.name.replace(' Protein', '').replace(' Micronised', '')}</strong>
                <em>{inr(fromPrice(product))}</em>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="marquee" aria-hidden="true">
        <div>
          <span>Authorised Legendary Sports Nutrition · Free delivery in Buldhana · Cash on delivery · Karale Layout counter · </span>
          <span>Authorised Legendary Sports Nutrition · Free delivery in Buldhana · Cash on delivery · Karale Layout counter · </span>
        </div>
      </div>

      <section className="wrap block" id="goals">
        <header className="section-head">
          <div>
            <p className="eyebrow">Shop by goal</p>
            <h2>Built for every stage</h2>
          </div>
          <Link to="/shop">View all</Link>
        </header>
        <div className="stage-grid">
          {STAGES.map((stage) => {
            const product = bySlug(stage.slug);
            return (
              <Link key={stage.category} to={`/shop?category=${encodeURIComponent(stage.category)}`} className="stage-card">
                <Pack src={product?.images[0]} alt="" />
                <span>
                  <small>{stage.line}</small>
                  <strong>{stage.category}</strong>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="wrap block">
        <header className="section-head">
          <div>
            <p className="eyebrow">Best sellers</p>
            <h2>Athlete favourites</h2>
          </div>
          <Link to="/shop">View all products</Link>
        </header>
        {error && <p className="warn">{error}</p>}
        {!products && !error && <p className="quiet-line">Loading the shelf…</p>}
        <div className="catalog">
          {favourites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="wrap honest">
        <div className="honest-photo">
          <img src="/logo.png" alt="" />
          <span>Same-day pickup</span>
        </div>
        <div>
          <p className="eyebrow">The counter</p>
          <h2>Strong brand. Honest shop.</h2>
          <p>Majboot is the Buldhana counter for Legendary Sports Nutrition. The tub you order is the tub on the shelf in Karale Layout.</p>
          <ul>
            <li><strong>Authorised distributor</strong><span>Same products the brand lists.</span></li>
            <li><strong>Cash on delivery</strong><span>Pay the rider, or pay at the counter.</span></li>
            <li><strong>{settings.address}</strong><span>{settings.phone}</span></li>
          </ul>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap">
          <p className="eyebrow light">Karale Layout, Buldhana</p>
          <h2>Stop guessing. Start lifting.</h2>
          <div className="hero-actions">
            <Link className="btn btn-gold" to="/shop">Shop the counter</Link>
            <a className="btn btn-line light" href={waLink(settings.whatsapp, 'Hello Majboot Protein Shop.')}>WhatsApp {settings.phone}</a>
            <a className="btn btn-line light" href={telLink(settings.whatsapp)}>Call</a>
          </div>
        </div>
      </section>
    </main>
  );
}
