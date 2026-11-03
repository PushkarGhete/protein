import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCart, useSettings } from '../context';
import { inr, telLink, waLink } from '../utils';

const LINKS = [
  { to: '/shop', label: 'Shop all' },
  { to: '/shop?category=Whey', label: 'Whey' },
  { to: '/shop?category=Gainers', label: 'Gainers' },
  { to: '/shop?category=Pre-Workout', label: 'Pre-workout' },
  { to: '/shop?category=Aminos', label: 'Aminos' },
  { to: '/shop?category=Energy', label: 'Energy' },
  { to: '/counter', label: 'Counter' },
];

export function StoreLayout() {
  const cart = useCart();
  const settings = useSettings();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const [hideNote, setHideNote] = useState(() => sessionStorage.getItem('majboot-note') === '1');

  useEffect(() => {
    setMenu(false);
    cart.setOpen(false);
    if (location.hash) {
      const node = document.querySelector(location.hash);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = cart.open || menu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [cart.open, menu]);

  return (
    <div className="frame">
      <div className="sticky">
        {!hideNote && settings.announcement && (
          <div className="announce">
            <p>{settings.announcement}</p>
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => {
                sessionStorage.setItem('majboot-note', '1');
                setHideNote(true);
              }}
            >
              Close
            </button>
          </div>
        )}
        <header className="header">
          <button className="icon-btn menu-btn" type="button" aria-label="Menu" onClick={() => setMenu(true)}>
            <span />
            <span />
          </button>
          <Link to="/" className="brand" aria-label="Majboot Protein Shop home">
            <img src="/logo.png" alt="" />
          </Link>
          <nav className="nav">
            {LINKS.map((link) => {
              const [path, query] = link.to.split('?');
              const current = query
                ? location.pathname === path && location.search === `?${query}`
                : location.pathname === path && !location.search;
              return (
                <NavLink key={link.to} to={link.to} className={() => (current ? 'active' : '')}>
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
          <button className="bag-btn" type="button" onClick={() => cart.setOpen(true)}>
            Cart
            <strong>{cart.count}</strong>
          </button>
        </header>
      </div>

      <Outlet />

      <footer className="footer">
        <div className="wrap footer-grid">
          <div>
            <img src="/logo.png" alt="Majboot Protein Shop" />
            <p>Authorised counter for Legendary Sports Nutrition in Buldhana.</p>
          </div>
          <div>
            <p className="footer-label">Visit</p>
            <p>{settings.address}</p>
            <a href={telLink(settings.whatsapp)}>{settings.phone}</a>
            <a href={settings.instagram} target="_blank" rel="noreferrer">
              {settings.instagramHandle}
            </a>
          </div>
          <div>
            <p className="footer-label">Shelf</p>
            <Link to="/shop">All products</Link>
            <Link to="/shop?category=Whey">Whey</Link>
            <Link to="/shop?category=Pre-Workout">Pre-workout</Link>
            <Link to="/shop?category=Gainers">Gainers</Link>
            <Link to="/track">Track an order</Link>
          </div>
          <div>
            <p className="footer-label">Counter</p>
            <Link to="/counter">Hours and map</Link>
            <a href={waLink(settings.whatsapp, 'Hello Majboot Protein Shop, I want to ask about a product.')}>
              WhatsApp
            </a>
            <Link to="/admin">Shop desk</Link>
          </div>
        </div>
        <div className="wrap legal">
          <p>Supplements are not medicine and not a substitute for food. Use as directed on the pack.</p>
          <p>© {new Date().getFullYear()} Majboot Protein Shop</p>
        </div>
      </footer>

      {menu && (
        <div className="overlay" onClick={() => setMenu(false)}>
          <nav className="mobile-nav" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="text-btn" onClick={() => setMenu(false)}>
              Close
            </button>
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
            <a href={telLink(settings.whatsapp)}>{settings.phone}</a>
          </nav>
        </div>
      )}

      {cart.open && (
        <div className="overlay" onClick={() => cart.setOpen(false)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()} aria-label="Cart">
            <header>
              <div>
                <p className="eyebrow">Your cart</p>
                <h2>Ready to lift</h2>
              </div>
              <button type="button" className="text-btn" onClick={() => cart.setOpen(false)}>
                Close
              </button>
            </header>
            {cart.items.length === 0 ? (
              <div className="drawer-empty">
                <p>Nothing in the bag yet.</p>
                <Link to="/shop" className="btn btn-ink">
                  Open the shelf
                </Link>
              </div>
            ) : (
              <>
                <ul className="drawer-lines">
                  {cart.items.map((item) => (
                    <li key={item.variantId}>
                      <img src={item.image} alt="" />
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.flavour}
                          {item.weight ? ` · ${item.weight}` : ''}
                        </p>
                        <div className="line-actions">
                          <Qty
                            value={item.qty}
                            max={Math.min(20, item.stock || 20)}
                            onChange={(qty) => cart.setQty(item.variantId, qty)}
                          />
                          <button type="button" className="text-btn" onClick={() => cart.remove(item.variantId)}>
                            Remove
                          </button>
                        </div>
                      </div>
                      <em>{inr(item.price * item.qty)}</em>
                    </li>
                  ))}
                </ul>
                <footer>
                  <div className="ship-meter" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (cart.subtotal / (settings.freeShipOver || 1)) * 100)}%` }} />
                  </div>
                  <small>
                    {cart.subtotal >= settings.freeShipOver
                      ? 'Free delivery unlocked on this order.'
                      : `Add ${inr(settings.freeShipOver - cart.subtotal)} for free delivery outside Buldhana.`}
                  </small>
                  <p>
                    <span>Subtotal</span>
                    <strong>{inr(cart.subtotal)}</strong>
                  </p>
                  <Link to="/checkout" className="btn btn-ink">
                    Proceed to checkout
                  </Link>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export function Qty({ value, max = 20, onChange }) {
  return (
    <div className="qty">
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(Math.max(1, value - 1))}>
        –
      </button>
      <span>{value}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function Pack({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) return <span className={`pack-fallback ${className}`}>{alt?.slice(0, 1) || 'M'}</span>;
  return <img className={className} src={src} alt={alt || ''} onError={() => setFailed(true)} />;
}
