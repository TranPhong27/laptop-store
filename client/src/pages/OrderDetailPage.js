import React, { useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Container, Spinner, Table } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const statusLabels = {
  Pending: 'Chờ xử lý',
  Confirmed: 'Đã xác nhận',
  Shipping: 'Đang giao',
  Completed: 'Hoàn tất',
  Cancelled: 'Đã hủy',
};

const paymentStatusLabels = {
  Unpaid: 'Chưa thanh toán',
  Paid: 'Đã thanh toán',
};

export default function OrderDetailPage({ admin = false }) {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const endpoint = admin ? `/api/orders/${id}` : `/api/orders/my/${id}`;
        const res = await api.get(endpoint);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [admin, id, user]);

  const cancelOrder = async () => {
    const ok = window.confirm('Bạn có chắc muốn hủy đơn hàng này?');
    if (!ok) return;

    try {
      setSaving(true);
      setError('');
      const res = await api.patch(`/api/orders/my/${id}/cancel`);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Container className="orders-page">
        <Alert variant="warning">Bạn cần đăng nhập để xem đơn hàng.</Alert>
        <Button as={Link} to="/login" variant="primary">Đăng nhập</Button>
      </Container>
    );
  }

  if (loading) {
    return <Container className="orders-page"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="orders-page">
      <div className="orders-header">
        <div>
          <h2 className="mb-1">Chi tiết đơn hàng</h2>
          {order && <div className="text-muted">#{String(order._id).slice(-8).toUpperCase()} - {formatDate(order.createdAt)}</div>}
        </div>
        <Button as={Link} to={admin ? '/admin/orders' : '/orders'} variant="outline-secondary">
          Quay lại
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {order && (
        <div className="order-card">
          <div className="order-card-header">
            <div>
              <Badge bg={order.status === 'Cancelled' ? 'danger' : 'secondary'}>
                {statusLabels[order.status] || order.status}
              </Badge>
              <div className="order-address mt-2">
                Thanh toán: {order.paymentMethod || 'COD'} - {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
              </div>
            </div>
            {!admin && order.status === 'Pending' && (
              <Button variant="outline-danger" disabled={saving} onClick={cancelOrder}>
                {saving ? 'Đang hủy...' : 'Hủy đơn'}
              </Button>
            )}
          </div>

          <div className="order-address mb-3">
            <strong>Giao đến:</strong> {order.shippingAddress?.fullName}, {order.shippingAddress?.phone}, {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.country}
          </div>

          <Table responsive bordered>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={`${order._id}-${item.productId}`}>
                  <td>{item.name}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="order-total">{formatCurrency(order.totalPrice)}</div>
        </div>
      )}
    </Container>
  );
}
