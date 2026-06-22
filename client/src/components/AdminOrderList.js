import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Form, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const statusOptions = [
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Shipping', label: 'Đang giao' },
  { value: 'Completed', label: 'Hoàn tất' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const paymentStatusLabels = {
  Unpaid: 'Chưa thanh toán',
  Paid: 'Đã thanh toán',
};

export default function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    return orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false;

      const createdTime = order.createdAt ? new Date(order.createdAt).getTime() : 0;
      if (fromTime && createdTime < fromTime) return false;
      if (toTime && createdTime > toTime) return false;

      if (!term) return true;
      const haystack = [
        order._id,
        order.userId?.email,
        order.userId?.name,
        order.shippingAddress?.fullName,
        order.shippingAddress?.phone,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(term);
    });
  }, [dateFrom, dateTo, orders, search, statusFilter]);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      setError('');
      const res = await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => (order._id === orderId ? res.data : order)));
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được trạng thái đơn hàng');
    } finally {
      setUpdatingId('');
    }
  };

  if (loading) {
    return <div className="text-center py-4"><Spinner animation="border" /></div>;
  }

  return (
    <div className="admin-page py-4">
      <div className="admin-order-header">
        <div>
          <h2 className="mb-1">Quản lý đơn hàng</h2>
          <div className="text-muted">Theo dõi đơn COD và cập nhật trạng thái xử lý.</div>
        </div>
        <Button variant="outline-primary" onClick={loadOrders}>Tải lại</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="admin-order-filters">
        <Form.Control placeholder="Tìm mã đơn, email, tên, số điện thoại" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Form.Select>
        <Form.Control type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <Form.Control type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
      </div>

      <Table bordered hover responsive className="admin-order-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Sản phẩm</th>
            <th>Thanh toán</th>
            <th>Tổng tiền</th>
            <th>Ngày tạo</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order._id}>
              <td>
                <div className="order-id">#{String(order._id).slice(-8).toUpperCase()}</div>
                <div className="text-muted small">{order.userId?.email || ''}</div>
                <Button as={Link} to={`/admin/orders/${order._id}`} size="sm" variant="link" className="p-0 mt-1">Chi tiết</Button>
              </td>
              <td>
                <div>{order.shippingAddress?.fullName}</div>
                <div className="text-muted small">{order.shippingAddress?.phone}</div>
                <div className="text-muted small">{order.shippingAddress?.address}, {order.shippingAddress?.city}</div>
              </td>
              <td>
                {order.items.map((item) => (
                  <div key={`${order._id}-${item.productId}`} className="admin-order-item">
                    {item.name} <span className="text-muted">x{item.quantity}</span>
                  </div>
                ))}
              </td>
              <td>
                <Badge bg="light" text="dark">{order.paymentMethod || 'COD'}</Badge>
                <div className="text-muted small mt-1">{paymentStatusLabels[order.paymentStatus] || order.paymentStatus}</div>
              </td>
              <td>{formatCurrency(order.totalPrice)}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <Form.Select
                  size="sm"
                  value={order.status}
                  disabled={updatingId === order._id || order.status === 'Cancelled'}
                  onChange={(event) => updateStatus(order._id, event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Form.Select>
              </td>
            </tr>
          ))}
          {!filteredOrders.length && (
            <tr>
              <td colSpan={7} className="text-center text-muted py-4">Không có đơn hàng phù hợp.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
