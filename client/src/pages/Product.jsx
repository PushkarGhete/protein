import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Pack, Qty } from '../components/Chrome';
import { ProductCard } from '../components/ProductCard';
import { useCart, useSettings, useToast } from '../context';
import { defaultVariant, inr, savePct, useTitle, waLink } from '../utils';

function Related({ product, related }) {
  const others = related.filter((item) => item.id !== product.id);
  const same = others.filter((item) => item.category === product.category);
  const picks = (same.length ? same : others.filter((item) => item.bestseller || item.featured)).slice(0, 3);
  if (!picks.length) return null;
  return (
    <section className="block">
      <header className="section-head">
        <span>Also</span>
        <div>
          <h2>Beside it on the shelf</h2>
        </div>
      </header>
      <div className="catalog">
        {picks.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}

export function Product() {
  const { slug } = useParams();
  const cart = useCart();
  const toast = useToast();
  const settings = useSettings();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [flavour, setFlavour] = useState('');
  const [weight, setWeight] = useState('');
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(null);

  useTitle(product?.name || 'Product');

  useEffect(() => {
    setProduct(null);
    setError('');
    api(`/api/products/${slug}`)
      .then((item) => {
        const variant = defaultVariant(item);
        setProduct(item);
        setFlavour(variant.flavour);
        setWeight(variant.weight);
        setQty(1);
        setPhoto(null);
      })
      .catch((err) => setError(err.message));
    api('/api/products')
      .then((items) => setRelated(items))
      .catch(() => {});
  }, [slug]);

  if (error) {
    return (
      <main className="wrap page">
        <h1>Off the shelf</h1>
        <p>{error}</p>
        <Link to="/shop">Back to the shelf</Link>
      </main>
    );
  }
  if (!product) return <main className="wrap page"><p className="quiet-line">Loading…</p></main>;

  const flavours = [...new Set(product.variants.map((variant) => variant.flavour))];
  const weights = product.variants.filter((variant) => variant.flavour === flavour);
  const variant = product.variants.find((item) => item.flavour === flavour && item.weight === weight) || product.variants[0];
  const gallery = product.images.length ? product.images : [variant.image].filter(Boolean);
  const shown = photo || variant.image || gallery[0];
  const pct = savePct(variant.price, variant.mrp);
  const max = Math.max(1, Math.min(20, variant.stock));

  function chooseFlavour(next) {
    setFlavour(next);
    const options = product.variants.filter((item) => item.flavour === next);
    if (!options.some((item) => item.weight === weight)) setWeight(options[0].weight);
    setPhoto(null);
    setQty(1);
  }

  return (
    <main className="wrap page">
      <p className="crumb">
        <Link to="/shop">Shelf</Link>
        <span>/</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
      </p>
      <div className="pdp">
        <div className="gallery">
          <div className="gallery-main">
            <Pack src={shown} alt={product.name} />
          </div>
          {gallery.length > 1 && (
            <div className="thumbs">
              {gallery.map((src) => (
                <button key={src} type="button" className={shown === src ? 'on' : ''} onClick={() => setPhoto(src)}>
                  <Pack src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="buy">
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className="lede">{product.tagline}</p>
          <div className="price-line">
            <strong>{inr(variant.price)}</strong>
            {variant.mrp > variant.price && <s>{inr(variant.mrp)}</s>}
            {pct > 0 && <em>Save {pct}%</em>}
          </div>

          <fieldset>
            <legend>Flavour</legend>
            <div className="pills">
              {flavours.map((item) => (
                <button key={item} type="button" className={item === flavour ? 'on' : ''} onClick={() => chooseFlavour(item)}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
          {weights.some((item) => item.weight) && (
            <fieldset>
              <legend>Size</legend>
              <div className="pills">
                {weights.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.weight === weight ? 'on' : ''}
                    onClick={() => {
                      setWeight(item.weight);
                      setPhoto(null);
                      setQty(1);
                    }}
                  >
                    {item.weight}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {variant.stock <= 0 && <p className="warn">Sold out in this flavour.</p>}
          {variant.stock > 0 && variant.stock <= 6 && <p className="warn">Only {variant.stock} left in this flavour.</p>}

          <div className="buy-row">
            <Qty value={Math.min(qty, max)} max={max} onChange={setQty} />
            <button
              type="button"
              className="btn btn-gold"
              disabled={variant.stock <= 0}
              onClick={() => {
                cart.add(product, variant, Math.min(qty, max));
                toast('Added to the bag');
              }}
            >
              Add to bag
            </button>
          </div>
          <a
            className="btn btn-line wide"
            href={waLink(
              settings.whatsapp,
              `Hello Majboot, I want ${product.name} (${variant.flavour}${variant.weight ? `, ${variant.weight}` : ''}) × ${qty}.`
            )}
          >
            Order this on WhatsApp
          </a>
          <p className="fine">Cash on delivery, or pay at the Karale Layout counter. Free delivery in Buldhana and on orders over {inr(settings.freeShipOver)}.</p>
          <ul className="facts">
            {product.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="story">
        <div>
          <h2>About this tub</h2>
          <p>{product.description}</p>
        </div>
        <div>
          <h2>How to use</h2>
          <p>{product.howToUse}</p>
          <p className="fine">Follow the scoop on the pack. This is a supplement, not a medicine.</p>
        </div>
      </section>

      <dl className="spec">
        <div><dt>Brand</dt><dd>{product.brand}</dd></div>
        <div><dt>For</dt><dd>{product.goal}</dd></div>
        <div><dt>Shelf</dt><dd>{product.category}</dd></div>
        <div><dt>Flavours</dt><dd>{flavours.length}</dd></div>
      </dl>

      <Related product={product} related={related} />
    </main>
  );
}
