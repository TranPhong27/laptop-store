import React, { useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Container, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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

export default function OrdersPage() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/api/orders/my');
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const cancelOrder = async (orderId) => {
    const ok = window.confirm('Bạn có chắc muốn hủy đơn hàng này?');
    if (!ok) return;

    try {
      setSavingId(orderId);
      setError('');
      const res = await api.patch(`/api/orders/my/${orderId}/cancel`);
      setOrders((current) => current.map((order) => (order._id === orderId ? res.data : order)));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setSavingId('');
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

  return (
    <Container className="orders-page">
      <div className="orders-header">
        <h2 className="mb-1">Đơn hàng của tôi</h2>
        <Button as={Link} to="/products" variant="outline-primary">Tiếp tục mua sắm</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Spinner animation="border" />}

      {!loading && !orders.length && (
        <Alert variant="info">Bạn chưa có đơn hàng nào.</Alert>
      )}

      {orders.map((order) => (
        <div className="order-card" key={order._id}>
          <div className="order-card-header">
            <div>
              <div className="order-id">Đơn #{String(order._id).slice(-8).toUpperCase()}</div>
              <div className="text-muted small">{formatDate(order.createdAt)}</div>
            </div>
            <div className="order-card-actions">
              <Badge bg={order.status === 'Cancelled' ? 'danger' : 'secondary'}>
                {statusLabels[order.status] || order.status}
              </Badge>
              <Button as={Link} to={`/orders/${order._id}`} size="sm" variant="outline-primary">Chi tiết</Button>
              {order.status === 'Pending' && (
                <Button size="sm" variant="outline-danger" disabled={savingId === order._id} onClick={() => cancelOrder(order._id)}>
                  {savingId === order._id ? 'Đang hủy...' : 'Hủy đơn'}
                </Button>
              )}
            </div>
          </div>

          <Table responsive size="sm" className="mb-2">
            <tbody>
              {order.items.map((item) => (
                <tr key={`${order._id}-${item.productId}`}>
                  <td>{item.name}</td>
                  <td className="text-center">x{item.quantity}</td>
                  <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="order-address">
            Giao đến: {order.shippingAddress?.fullName}, {order.shippingAddress?.phone}, {order.shippingAddress?.address}, {order.shippingAddress?.city}
          </div>
          <div className="order-address">
            Thanh toán: {order.paymentMethod || 'COD'} - {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
          </div>
          <div className="order-total">{formatCurrency(order.totalPrice)}</div>
        </div>
      ))}
    </Container>
  );
}
