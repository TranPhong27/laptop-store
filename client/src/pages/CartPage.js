import React, { useContext, useState } from 'react';
import { Container, Table, Button, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

export default function CartPage() {
  const { items, loading, error, totalItems, totalPrice, updateItem, removeItem, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [checkoutError, setCheckoutError] = useState('');
  const navigate = useNavigate();

  const goToCheckout = () => {
    if (!user) {
      setCheckoutError('Vui lòng đăng nhập để thanh toán.');
      navigate('/login');
      return;
    }

    navigate('/checkout');
  };

  if (loading) return <Container className="py-4">Đang tải giỏ hàng...</Container>;

  return (
    <Container className="py-4">
      <h2 className="mb-4">Giỏ hàng</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {checkoutError && <Alert variant="warning">{checkoutError}</Alert>}

      {!items.length ? (
        <div className="text-muted">Giỏ hàng của bạn đang trống.</div>
      ) : (
        <>
          <Table responsive bordered>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th style={{ width: 140 }}>Số lượng</th>
                <th>Thành tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={String(it.productId)}>
                  <td>{it.name}</td>
                  <td>{formatCurrency(it.price)}</td>
                  <td>
                    <Form.Control
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) => updateItem(it.productId, Number(e.target.value))}
                    />
                  </td>
                  <td>{formatCurrency(it.price * it.quantity)}</td>
                  <td>
                    <Button variant="outline-danger" size="sm" onClick={() => removeItem(it.productId)}>Xóa</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted">Tổng {totalItems} sản phẩm</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>{formatCurrency(totalPrice)}</div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <Button variant="secondary" onClick={clearCart}>Xóa tất cả</Button>
            <Button variant="primary" onClick={goToCheckout}>Thanh toán</Button>
          </div>
        </>
      )}
    </Container>
  );
}
