import React, { useEffect, useState } from 'react';
import { Table, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AdminProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products/admin');
      const data = Array.isArray(res.data) ? res.data : res.data.products || [];
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm('Bạn có chắc muốn xóa sản phẩm này?');
    if (!ok) return;
    try {
      await api.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Xóa sản phẩm thất bại');
    }
  };

  if (loading) return <div className="text-center py-4"><Spinner animation="border" /></div>;

  return (
    <div className="admin-page py-4">
      <Row className="mb-3 align-items-center">
        <Col><h2>Danh sách sản phẩm (Admin)</h2></Col>
        <Col className="text-end"><Button as={Link} to="/admin/products/new">Thêm sản phẩm</Button></Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Tên</th>
            <th>Thương hiệu</th>
            <th>Giá</th>
            <th>Ảnh</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.brand}</td>
              <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</td>
              <td style={{ maxWidth: 120 }}><img src={p.images?.[0] || p.image} alt={p.name} style={{ maxWidth: '100%' }} /></td>
              <td>
                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => navigate(`/admin/products/${p._id}`)}>Sửa</Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p._id)}>Xóa</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
