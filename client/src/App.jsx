import { Navigate, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './components/Chrome';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Product } from './pages/Product';
import { Checkout } from './pages/Checkout';
import { Order, Track } from './pages/Order';
import { Counter } from './pages/Counter';
import {
  AdminLayout,
  Dashboard,
  Enquiries,
  Login,
  OrderDetail,
  Orders,
  ProductEditor,
  Products,
  Settings,
} from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductEditor />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:code" element={<Order />} />
        <Route path="/track" element={<Track />} />
        <Route path="/counter" element={<Counter />} />
        <Route path="*" element={<Missing />} />
      </Route>
    </Routes>
  );
}

function Missing() {
  return (
    <main className="wrap page">
      <h1>That page is not on the shelf.</h1>
      <a className="btn btn-ink" href="/">Back home</a>
    </main>
  );
}

export function Redirect() {
  return <Navigate to="/" replace />;
}
