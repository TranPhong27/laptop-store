import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import api from '../services/api';

const getPrimaryImage = (product) => product.images?.[0] || product.image;

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export default function Hero() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/api/products')
      .then((res) => setFeatured(res.data.slice(0, 4)))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      <section className="hero-banner d-flex align-items-center text-white">
        <Container>
          <Row className="align-items-center">
            <Col md={7}>
              <h1 className="hero-title">Laptop tốt, giá hợp lý, giao hàng nhanh.</h1>
              <p className="lead">
                Chọn mẫu máy phù hợp cho học tập, công việc và giải trí với nhiều ưu đãi cập nhật mỗi ngày.
              </p>
              <Button href="/products" variant="light" className="me-2">Mua ngay</Button>
              <Button href="/products" variant="outline-light">Xem tất cả</Button>
            </Col>
            <Col md={5} className="text-end d-none d-md-block">
              <img
                src="/hero-laptop.png"
                alt="Laptop"
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        <h3 className="mb-4">Sản phẩm nổi bật</h3>
        <Row xs={1} sm={2} md={4} className="g-4">
          {featured.map((p) => (
            <Col key={p._id}>
              <Card className="h-100 product-card">
                <Card.Img variant="top" src={getPrimaryImage(p)} style={{ height: 160, objectFit: 'cover' }} />
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <Card.Title className="mb-1 small">{p.name}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted xsmall">{p.brand}</Card.Subtitle>
                    </div>
                    <Badge bg="warning" text="dark">-{p.discount || 0}%</Badge>
                  </div>
                  <div className="mt-2 d-flex justify-content-between align-items-center">
                    <strong className="me-2">{formatCurrency(p.price)}</strong>
                    <Button as={Link} to={`/products/${p._id}`} variant="primary" size="sm">Xem chi tiết</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
