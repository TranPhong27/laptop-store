import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Login from './components/Login';
import Register from './components/Register';
import Hero from './components/Hero';
import AdminProductCreate from './components/AdminProductCreate';
import AdminProductList from './components/AdminProductList';
import AdminOrderList from './components/AdminOrderList';
import CartPage from './pages/CartPage';
import ComparePage from './pages/ComparePage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import { CartProvider } from './context/CartContext';
import AdminRoute from './components/AdminRoute';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Container, Navbar, Nav as RBNav, NavDropdown, Badge } from 'react-bootstrap';
import { useCart } from './context/CartContext';

function App() {
  const Nav = () => {
    const { user, logout } = React.useContext(AuthContext);
    const { totalItems } = useCart();
    return (
      <Navbar bg="light" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <img
              src="/logo.png"
              alt="LaptopHouse"
              height="36"
              className="d-inline-block align-top"
            />
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <RBNav className="me-auto">
              <RBNav.Link as={Link} to="/">Trang chủ</RBNav.Link>
              <RBNav.Link as={Link} to="/products">Sản phẩm</RBNav.Link>
              <RBNav.Link as={Link} to="/cart">Giỏ hàng {totalItems ? <Badge bg="secondary" className="ms-1">{totalItems}</Badge> : null}</RBNav.Link>
            </RBNav>
            <RBNav>
              {user ? (
                <NavDropdown title={user.name || user.email} id="user-dropdown">
                  <NavDropdown.Item as={Link} to="/orders">Đơn hàng của tôi</NavDropdown.Item>
                  {user.role === 'admin' && (
                    <>
                      <NavDropdown.Item as={Link} to="/admin/products">Quản lý sản phẩm</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/orders">Quản lý đơn hàng</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/products/new">Thêm sản phẩm</NavDropdown.Item>
                    </>
                  )}
                  <NavDropdown.Item onClick={logout}>Đăng xuất</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <>
                  <RBNav.Link as={Link} to="/login">Đăng nhập</RBNav.Link>
                  <RBNav.Link as={Link} to="/register">Đăng ký</RBNav.Link>
                </>
              )}
            </RBNav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  };

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="App">
            <Nav />
            <Container>
              <Routes>
                <Route path="/" element={<Hero />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/admin/products/new"
                  element={(
                    <AdminRoute>
                      <AdminProductCreate />
                    </AdminRoute>
                  )}
                />
                <Route
                  path="/admin/products"
                  element={(
                    <AdminRoute>
                      <AdminProductList />
                    </AdminRoute>
                  )}
                />
                <Route
                  path="/admin/orders"
                  element={(
                    <AdminRoute>
                      <AdminOrderList />
                    </AdminRoute>
                  )}
                />
                <Route
                  path="/admin/orders/:id"
                  element={(
                    <AdminRoute>
                      <OrderDetailPage admin />
                    </AdminRoute>
                  )}
                />
                <Route
                  path="/admin/products/:id"
                  element={(
                    <AdminRoute>
                      <AdminProductCreate />
                    </AdminRoute>
                  )}
                />
                <Route path="/cart" element={<CartPage />} />
              </Routes>
            </Container>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
