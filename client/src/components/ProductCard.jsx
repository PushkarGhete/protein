import { Link } from 'react-router-dom';
import { useCart, useToast } from '../context';
import { cheapest, defaultVariant, flavourCount, inr, savePct } from '../utils';
import { Pack } from './Chrome';

export function ProductCard({ product }) {
  const cart = useCart();
  const toast = useToast();
  const variant = cheapest(product);
  const pct = savePct(variant.price, variant.mrp);
  const flavours = flavourCount(product);
  const soldOut = product.variants.every((item) => item.stock <= 0);
  const weights = [...new Set(product.variants.map((item) => item.weight))].filter(Boolean);

  return (
    <article className="pcard">
      <Link to={`/product/${product.slug}`} className="pcard-media">
        {product.bestseller && <span className="stamp">Bestseller</span>}
        {pct > 0 && <span className="save">-{pct}%</span>}
        <Pack src={product.images[0]} alt={product.name} />
      </Link>
      <div className="pcard-body">
        <p>{product.category}</p>
        <h3>
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="meta">
          {flavours} flavour{flavours === 1 ? '' : 's'}
          {weights.length ? ` · ${weights.join(', ')}` : ''}
        </p>
        <div className="pcard-row">
          <span className="price">
            <strong>{product.variants.length > 1 ? 'From ' : ''}{inr(variant.price)}</strong>
            {variant.mrp > variant.price && <s>{inr(variant.mrp)}</s>}
          </span>
          <button
            type="button"
            className="plus"
            disabled={soldOut}
            aria-label={soldOut ? 'Sold out' : `Add ${product.name}`}
            onClick={() => {
              const pick = defaultVariant(product);
              if (!pick || pick.stock <= 0) return;
              cart.add(product, pick, 1);
              toast(`Added ${product.name}`);
            }}
          >
            {soldOut ? '–' : '+'}
          </button>
        </div>
      </div>
    </article>
  );
}
