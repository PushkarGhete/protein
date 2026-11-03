import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES, GOALS, useTitle } from '../utils';

export function Shop() {
  useTitle('All supplements');
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState(params.get('q') || '');
  const category = params.get('category') || 'All';
  const goal = params.get('goal') || 'All';
  const sort = params.get('sort') || 'featured';

  useEffect(() => {
    api('/api/products')
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (q.trim()) next.set('q', q.trim());
      else next.delete('q');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    const clear = !value || value === 'All' || (key === 'sort' && value === 'featured');
    if (clear) next.delete(key);
    else next.set(key, value);
    setParams(next);
  }

  const list = useMemo(() => {
    if (!products) return [];
    const query = (params.get('q') || '').toLowerCase();
    const filtered = products.filter((product) => {
      if (category !== 'All' && product.category !== category) return false;
      if (goal !== 'All' && product.goal !== goal) return false;
      if (!query) return true;
      const hay = `${product.name} ${product.tagline} ${product.category} ${product.variants.map((variant) => variant.flavour).join(' ')}`.toLowerCase();
      return hay.includes(query);
    });
    const priced = (product) => Math.min(...product.variants.map((variant) => variant.price));
    if (sort === 'price-asc') filtered.sort((a, b) => priced(a) - priced(b));
    else if (sort === 'price-desc') filtered.sort((a, b) => priced(b) - priced(a));
    else if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else filtered.sort((a, b) => Number(b.bestseller) - Number(a.bestseller) || a.name.localeCompare(b.name));
    return filtered;
  }, [products, category, goal, sort, params]);

  return (
    <main className="wrap page">
      <header className="page-head">
        <p className="eyebrow">Legendary Sports Nutrition</p>
        <h1>All supplements</h1>
        <p>{list.length || '—'} products on the counter. Whey, gainers, creatine, pre-workout and aminos.</p>
      </header>

      <div className="shop-tools">
        <input
          className="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search a tub or flavour"
          aria-label="Search products"
        />
        <label>
          Sort
          <select value={sort} onChange={(event) => setFilter('sort', event.target.value)}>
            <option value="featured">Counter picks</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <div className="chips">
        <button type="button" className={category === 'All' ? 'on' : ''} onClick={() => setFilter('category', 'All')}>
          All
        </button>
        {CATEGORIES.map((item) => (
          <button key={item} type="button" className={category === item ? 'on' : ''} onClick={() => setFilter('category', item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="chips slim">
        <button type="button" className={goal === 'All' ? 'on' : ''} onClick={() => setFilter('goal', 'All')}>
          Any goal
        </button>
        {GOALS.map((item) => (
          <button key={item.id} type="button" className={goal === item.id ? 'on' : ''} onClick={() => setFilter('goal', item.id)}>
            {item.id}
          </button>
        ))}
      </div>

      {error && <p className="warn">{error}</p>}
      {!products && !error && <p className="quiet-line">Loading the shelf…</p>}
      {products && list.length === 0 && <p className="quiet-line">Nothing matches that. Try another flavour or clear the filters.</p>}
      <div className="catalog">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
