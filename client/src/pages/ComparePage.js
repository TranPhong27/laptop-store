import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Image, Spinner, Table } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const COMPARE_KEY = 'compareProductIds';
const MAX_COMPARE = 3;

const getPrimaryImage = (product) => product.images?.[0] || product.image;

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const usageLabels = {
  student: 'Học tập',
  office: 'Văn phòng',
  gaming: 'Gaming',
  design: 'Đồ họa',
  premium: 'Cao cấp',
};

const conditionLabels = {
  new: 'Mới',
  likeNew: 'Like new',
  used: 'Đã qua sử dụng',
};

const getUsageText = (usage) => {
  const values = Array.isArray(usage) ? usage : usage ? [usage] : [];
  return values.map((value) => usageLabels[value] || value).filter(Boolean).join(', ') || 'Đang cập nhật';
};

const specRows = [
  { label: 'Giá bán', getValue: (p) => formatCurrency(p.price) },
  { label: 'Giá gốc', getValue: (p) => (p.originalPrice ? formatCurrency(p.originalPrice) : '-') },
  { label: 'Giảm giá', getValue: (p) => (p.discount ? `${p.discount}%` : '-') },
  { label: 'Thương hiệu', getValue: (p) => p.brand || 'Đang cập nhật' },
  { label: 'CPU', getValue: (p) => p.cpu || 'Đang cập nhật' },
  { label: 'GPU', getValue: (p) => p.gpu || 'Đang cập nhật' },
  { label: 'RAM', getValue: (p) => p.ram || 'Đang cập nhật' },
  { label: 'Ổ cứng', getValue: (p) => p.storage || 'Đang cập nhật' },
  { label: 'Màn hình', getValue: (p) => p.screen || 'Đang cập nhật' },
  { label: 'Tình trạng', getValue: (p) => conditionLabels[p.condition] || 'Đang cập nhật' },
  { label: 'Nhu cầu', getValue: (p) => getUsageText(p.usage) },
  { label: 'Bảo hành', getValue: (p) => p.warranty || 'Đang cập nhật' },
  { label: 'Tồn kho', getValue: (p) => (p.stock > 0 ? `${p.stock} sản phẩm` : 'Hết hàng') },
];

const readSavedIds = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
    return Array.isArray(saved) ? saved.slice(0, MAX_COMPARE).map(String) : [];
  } catch (err) {
    return [];
  }
};

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addItem } = useCart();
  const navigate = useNavigate();

  const ids = useMemo(() => {
    const fromUrl = (searchParams.get('ids') || '').split(',').map((id) => id.trim()).filter(Boolean);
    return (fromUrl.length ? fromUrl : readSavedIds()).slice(0, MAX_COMPARE);
  }, [searchParams]);

  useEffect(() => {
    if (ids.length < 2) {
      setProducts([]);
      setError('');
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError('');
        localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
        const res = await api.get('/api/products/compare', { params: { ids: ids.join(',') } });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được danh sách so sánh');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [ids]);

  const removeProduct = (productId) => {
    const nextIds = ids.filter((id) => id !== String(productId));
    localStorage.setItem(COMPARE_KEY, JSON.stringify(nextIds));
    if (nextIds.length >= 2) {
      setSearchParams({ ids: nextIds.join(',') });
    } else {
      setProducts([]);
      navigate('/products');
    }
  };

  const clearCompare = () => {
    localStorage.removeItem(COMPARE_KEY);
    navigate('/products');
  };

  if (loading) {
    return (
      <div className="compare-page">
        <Spinner animation="border" />
      </div>
    );
  }

  if (ids.length < 2) {
    return (
      <div className="compare-page">
        <Alert variant="info">Chọn ít nhất 2 sản phẩm từ danh sách để so sánh.</Alert>
        <Button as={Link} to="/products" variant="primary">Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div className="compare-page">
      <div className="compare-header">
        <div>
          <h2 className="mb-1">So sánh sản phẩm</h2>
          <div className="text-muted">Tối đa {MAX_COMPARE} sản phẩm trong một lần so sánh.</div>
        </div>
        <div className="compare-header-actions">
          <Button as={Link} to="/products" variant="outline-primary">Chọn thêm</Button>
          <Button variant="outline-secondary" onClick={clearCompare}>Xóa tất cả</Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table responsive bordered className="compare-table">
        <thead>
          <tr>
            <th className="compare-row-label">Thông tin</th>
            {products.map((product) => (
              <th key={product._id}>
                <div className="compare-product-head">
                  {getPrimaryImage(product) && (
                    <Image src={getPrimaryImage(product)} alt={product.name} className="compare-product-image" />
                  )}
                  <div className="compare-product-name">{product.name}</div>
                  <div className="compare-product-actions">
                    <Button size="sm" variant="success" disabled={product.status === 'outOfStock' || product.stock === 0} onClick={() => addItem({ productId: product._id, name: product.name, price: product.price }, 1)}>
                      Thêm vào giỏ
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => removeProduct(product._id)}>
                      Xóa
                    </Button>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specRows.map((row) => (
            <tr key={row.label}>
              <th className="compare-row-label">{row.label}</th>
              {products.map((product) => (
                <td key={`${product._id}-${row.label}`}>{row.getValue(product)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
