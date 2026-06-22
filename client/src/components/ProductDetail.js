import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Image, Row, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const getImages = (product) => {
  const images = Array.isArray(product.images) ? product.images : [];
  if (images.length) return images;
  return product.image ? [product.image] : [];
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const conditionLabels = {
  new: 'Mới',
  likeNew: 'Like new',
  used: 'Đã qua sử dụng',
};

const usageLabels = {
  student: 'Học tập',
  office: 'Văn phòng',
  gaming: 'Gaming',
  design: 'Đồ họa',
  premium: 'Cao cấp',
};

const hasOriginalPrice = (product) => product.originalPrice && product.originalPrice > product.price;
const isOutOfStock = (product) => product.status === 'outOfStock' || product.stock === 0;

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/products/${id}`);
        const images = getImages(res.data);
        setProduct(res.data);
        setActiveImage(images[0] || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được chi tiết sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="product-detail-loading">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-start">
        {error}
      </Alert>
    );
  }

  if (!product) return null;

  const images = getImages(product);
  const outOfStock = isOutOfStock(product);

  return (
    <div className="product-detail-page">
      <Button as={Link} to="/products" variant="link" className="product-back-link">
        Quay lại danh sách
      </Button>

      <Row className="g-4 align-items-start">
        <Col lg={6}>
          <div className="product-detail-gallery">
            {activeImage && (
              <Image src={activeImage} alt={product.name} className="product-detail-main-image" fluid />
            )}
            {images.length > 1 && (
              <div className="product-detail-thumbs">
                {images.map((image) => (
                  <button
                    type="button"
                    key={image}
                    className={`product-detail-thumb ${activeImage === image ? 'active' : ''}`}
                    onClick={() => setActiveImage(image)}
                  >
                    <img src={image} alt={product.name} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Col>

        <Col lg={6}>
          <div className="product-detail-info">
            <div className="text-muted mb-2">{product.brand}</div>
            <h1>{product.name}</h1>
            <div className="product-detail-price-block">
              <div className="product-detail-price">{formatCurrency(product.price)}</div>
              {hasOriginalPrice(product) && (
                <div className="product-detail-original-price">
                  <span>{formatCurrency(product.originalPrice)}</span>
                  {product.discount ? <strong>-{product.discount}%</strong> : null}
                </div>
              )}
            </div>

            <div className="product-detail-specs">
              <div>
                <span>CPU</span>
                <strong>{product.cpu || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>GPU</span>
                <strong>{product.gpu || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>RAM</span>
                <strong>{product.ram || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>Ổ cứng</span>
                <strong>{product.storage || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>Màn hình</span>
                <strong>{product.screen || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>Bảo hành</span>
                <strong>{product.warranty || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>Tình trạng</span>
                <strong>{conditionLabels[product.condition] || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>Nhu cầu</span>
                <strong>
                  {Array.isArray(product.usage)
                    ? product.usage.map((u) => usageLabels[u] || u).join(', ')
                    : usageLabels[product.usage] || 'Đang cập nhật'}
                </strong>
              </div>
              <div>
                <span>Tồn kho</span>
                <strong>{outOfStock ? 'Hết hàng' : `${product.stock || 0} sản phẩm`}</strong>
              </div>
            </div>

            {product.description && (
              <div className="product-detail-description">
                <h2>Mô tả sản phẩm</h2>
                <p>{product.description}</p>
              </div>
            )}

            <Button
              size="lg"
              variant="success"
              disabled={outOfStock}
              onClick={() => addItem({ productId: product._id, name: product.name, price: product.price }, 1)}
            >
              {outOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}
