import React, { useContext, useState } from 'react';
import { Alert, Button, Col, Container, Form, Row, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const initialShippingAddress = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Việt Nam',
};

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState(initialShippingAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const updateField = (event) => {
    const { name, value } = event.target;
    setShippingAddress((current) => ({ ...current, [name]: value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!user) {
      setError('Vui lòng đăng nhập để thanh toán.');
      return;
    }
    if (!items.length) {
      setError('Giỏ hàng đang trống.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const res = await api.post('/api/orders', { shippingAddress });
      await clearCart();
      navigate('/orders', { state: { createdOrderId: res.data._id } });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo đơn hàng');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Container className="checkout-page">
        <Alert variant="warning">Bạn cần đăng nhập trước khi thanh toán.</Alert>
        <Button as={Link} to="/login" variant="primary">Đăng nhập</Button>
      </Container>
    );
  }

  if (!items.length) {
    return (
      <Container className="checkout-page">
        <Alert variant="info">Giỏ hàng đang trống.</Alert>
        <Button as={Link} to="/products" variant="primary">Tiếp tục mua sắm</Button>
      </Container>
    );
  }

  return (
    <Container className="checkout-page">
      <h2 className="mb-4">Thanh toán</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={7}>
          <Form onSubmit={submitOrder} className="checkout-form">
            <h5 className="mb-3">Thông tin giao hàng</h5>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="checkoutFullName">
                  <Form.Label>Họ tên người nhận</Form.Label>
                  <Form.Control name="fullName" value={shippingAddress.fullName} onChange={updateField} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="checkoutPhone">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control name="phone" value={shippingAddress.phone} onChange={updateField} required />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId="checkoutAddress">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control name="address" value={shippingAddress.address} onChange={updateField} required />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group controlId="checkoutCity">
                  <Form.Label>Tỉnh/Thành phố</Form.Label>
                  <Form.Control name="city" value={shippingAddress.city} onChange={updateField} required />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="checkoutPostalCode">
                  <Form.Label>Mã bưu chính</Form.Label>
                  <Form.Control name="postalCode" value={shippingAddress.postalCode} onChange={updateField} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="checkoutCountry">
                  <Form.Label>Quốc gia</Form.Label>
                  <Form.Control name="country" value={shippingAddress.country} onChange={updateField} required />
                </Form.Group>
              </Col>
            </Row>

            <div className="checkout-actions">
              <Button as={Link} to="/cart" variant="outline-secondary">Quay lại giỏ hàng</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Đang đặt hàng...' : 'Đặt hàng'}
              </Button>
            </div>
          </Form>
        </Col>

        <Col lg={5}>
          <div className="checkout-summary">
            <h5 className="mb-3">Tóm tắt đơn hàng</h5>
            <div className="checkout-payment-method">
              Thanh toán: <strong>COD - thanh toán khi nhận hàng</strong>
            </div>
            <Table responsive size="sm">
              <tbody>
                {items.map((item) => (
                  <tr key={String(item.productId)}>
                    <td>{item.name}</td>
                    <td className="text-center">x{item.quantity}</td>
                    <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="checkout-total-row">
              <span>Tổng {totalItems} sản phẩm</span>
              <strong>{formatCurrency(totalPrice)}</strong>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
