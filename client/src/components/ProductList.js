import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const getPrimaryImage = (product) => product.images?.[0] || product.image;
const COMPARE_KEY = 'compareProductIds';
const MAX_COMPARE = 3;

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

const hasOriginalPrice = (product) => product.originalPrice && product.originalPrice > product.price;

const brandOptions = ['MacBook', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Gigabyte'];

const priceOptions = [
  { label: 'Dưới 10 triệu', minPrice: '', maxPrice: '10000000' },
  { label: '10 - 15 triệu', minPrice: '10000000', maxPrice: '15000000' },
  { label: '15 - 20 triệu', minPrice: '15000000', maxPrice: '20000000' },
  { label: '20 - 30 triệu', minPrice: '20000000', maxPrice: '30000000' },
  { label: 'Trên 30 triệu', minPrice: '30000000', maxPrice: '' },
];

const usageOptions = [
  { label: 'Học tập', value: 'student' },
  { label: 'Văn phòng', value: 'office' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Đồ họa', value: 'design' },
  { label: 'Cao cấp', value: 'premium' },
];

const cpuOptions = [
  { label: 'Core i3', value: 'i3' },
  { label: 'Core i5', value: 'i5' },
  { label: 'Core i7', value: 'i7' },
  { label: 'Core i9', value: 'i9' },
  { label: 'Core 9', value: 'Core 9' },
  { label: 'Core 7', value: 'Core 7' },
  { label: 'Core 5', value: 'Core 5' },
  { label: 'Core 3', value: 'Core 3' },
  {label: 'Ryzen 3', value: 'Ryzen 3' },
  { label: 'Ryzen 5', value: 'Ryzen 5' },
  { label: 'Ryzen 7', value: 'Ryzen 7' },
  { label: 'Ryzen 9', value: 'Ryzen 9' },
  { label: 'Ultra 9', value: 'Ultra 9' },
  { label: 'Ultra 7', value: 'Ultra 7' },
  { label: 'Ultra 5', value: 'Ultra 5' },
  { label: 'Ultra X9', value: 'Ultra X9' },
  { label: 'Ultra X7', value: 'Ultra X7' },
];
const ramOptions = ['8 GB', '16 GB', '32 GB', '64 GB', '128 GB'];
const storageOptions = ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB'];
const screenSizeOptions = ['13', '14', '15.6', '16', '17.3'];
const gpuTypeOptions = [
  { label: 'Card rời', value: 'dedicated' },
  { label: 'Card tích hợp', value: 'integrated' },
];

const sortOptions = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá thấp đến cao', value: 'priceAsc' },
  { label: 'Giá cao đến thấp', value: 'priceDesc' },
  { label: 'Tên A-Z', value: 'nameAsc' },
];

const initialFilters = {
  brand: '',
  minPrice: '',
  maxPrice: '',
  cpu: '',
  ram: '',
  storage: '',
  screenSize: '',
  gpuType: '',
  usage: '',
  sort: 'newest',
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [compareIds, setCompareIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
      return Array.isArray(saved) ? saved.slice(0, MAX_COMPARE).map(String) : [];
    } catch (err) {
      return [];
    }
  });
  const [compareMessage, setCompareMessage] = useState('');
  const { addItem } = useCart();
  const navigate = useNavigate();

  const getQueryParams = (nextPage = page, nextSearch = search, nextFilters = filters) => {
    const params = { page: nextPage, limit };
    if (nextSearch.trim()) params.search = nextSearch.trim();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    return params;
  };

  const fetchProducts = async (opts = {}) => {
    const append = Boolean(opts.append);
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const nextPage = opts.page || page;
      const nextSearch = opts.search !== undefined ? opts.search : search;
      const nextFilters = opts.filters || filters;
      const params = getQueryParams(nextPage, nextSearch, nextFilters);

      const res = await api.get('/api/products', { params });
      if (Array.isArray(res.data)) {
        setProducts((current) => (append ? [...current, ...res.data] : res.data));
        setPage(1);
        setTotal(res.data.length);
      } else {
        const nextProducts = res.data.products || [];
        setProducts((current) => (append ? [...current, ...nextProducts] : nextProducts));
        setPage(res.data.page || 1);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const openFilters = () => {
    setDraftFilters(filters);
    setShowFilters(true);
  };

  const updateDraftFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: current[key] === value ? '' : value }));
  };

  const updatePriceFilter = (option) => {
    setDraftFilters((current) => {
      const isSelected = current.minPrice === option.minPrice && current.maxPrice === option.maxPrice;
      return {
        ...current,
        minPrice: isSelected ? '' : option.minPrice,
        maxPrice: isSelected ? '' : option.maxPrice,
      };
    });
  };

  const updateSort = (value) => {
    const nextFilters = { ...filters, sort: value };
    setFilters(nextFilters);
    setPage(1);
    fetchProducts({ page: 1, filters: nextFilters });
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
    setShowFilters(false);
    fetchProducts({ page: 1, filters: draftFilters });
  };

  const clearFilters = () => {
    setSearch('');
    setFilters(initialFilters);
    setDraftFilters(initialFilters);
    setPage(1);
    setShowFilters(false);
    fetchProducts({ page: 1, search: '', filters: initialFilters });
  };

  const hasActiveFilters = Boolean(
    search ||
    filters.brand ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.cpu ||
    filters.ram ||
    filters.storage ||
    filters.screenSize ||
    filters.gpuType ||
    filters.usage ||
    filters.sort !== 'newest'
  );

  const filterCount = [
    filters.brand,
    filters.minPrice || filters.maxPrice,
    filters.cpu,
    filters.ram,
    filters.storage,
    filters.screenSize,
    filters.gpuType,
    filters.usage,
  ].filter(Boolean).length;

  const hasDraftFilters = Boolean(
    draftFilters.brand ||
    draftFilters.minPrice ||
    draftFilters.maxPrice ||
    draftFilters.cpu ||
    draftFilters.ram ||
    draftFilters.storage ||
    draftFilters.screenSize ||
    draftFilters.gpuType ||
    draftFilters.usage ||
    draftFilters.sort !== 'newest'
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchProducts({ page: 1, search });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const goToProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = (event, product) => {
    event.stopPropagation();
    addItem({ productId: product._id, name: product.name, price: product.price }, 1);
  };

  const persistCompareIds = (nextIds) => {
    setCompareIds(nextIds);
    localStorage.setItem(COMPARE_KEY, JSON.stringify(nextIds));
  };

  const toggleCompare = (event, productId) => {
    event.stopPropagation();
    setCompareMessage('');

    const id = String(productId);
    if (compareIds.includes(id)) {
      persistCompareIds(compareIds.filter((currentId) => currentId !== id));
      return;
    }

    if (compareIds.length >= MAX_COMPARE) {
      setCompareMessage(`Chỉ có thể so sánh tối đa ${MAX_COMPARE} sản phẩm.`);
      return;
    }

    persistCompareIds([...compareIds, id]);
  };

  const clearCompare = () => {
    persistCompareIds([]);
    setCompareMessage('');
  };

  const goToCompare = () => {
    if (compareIds.length < 2) {
      setCompareMessage('Chọn ít nhất 2 sản phẩm để so sánh.');
      return;
    }

    navigate(`/compare?ids=${compareIds.join(',')}`);
  };

  const remaining = Math.max(total - products.length, 0);

  const handleLoadMore = () => {
    if (loadingMore || remaining <= 0) return;
    fetchProducts({ page: page + 1, append: true });
  };

  return (
    <Container className="py-4">
      <div className="product-toolbar">
        <div>
          <h2 className="mb-1">Danh sách laptop</h2>
          <div className="text-muted small">Lọc nhanh theo nhu cầu, cấu hình và ngân sách.</div>
        </div>
        <Form.Select className="product-sort" value={filters.sort} onChange={(e) => updateSort(e.target.value)}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Form.Select>
      </div>

      <Form className="mb-3" onSubmit={(e) => { e.preventDefault(); setPage(1); fetchProducts({ page: 1, search }); }}>
        <Row className="g-2 align-items-center">
          <Col xs={12} md={7} lg={5}>
            <Form.Control placeholder="Tìm laptop theo tên, hãng, CPU, RAM..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </Col>
          <Col xs="auto">
            <Button type="button" variant="outline-dark" onClick={openFilters}>
              Bộ lọc{filterCount ? ` (${filterCount})` : ''}
            </Button>
          </Col>
          <Col className="text-end text-muted">{loading ? <Spinner animation="border" size="sm" /> : `${total} kết quả`}</Col>
        </Row>
      </Form>

      <Modal show={showFilters} onHide={() => setShowFilters(false)} dialogClassName="filter-modal" contentClassName="filter-modal-content">
        <Modal.Header closeButton>
          <Modal.Title>Bộ lọc laptop</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="filter-section">
            <div className="filter-section-title">Hãng</div>
            <div className="filter-grid">
              {brandOptions.map((brand) => (
                <Button
                  key={brand}
                  size="sm"
                  variant={draftFilters.brand === brand ? 'primary' : 'outline-secondary'}
                  className="filter-chip"
                  onClick={() => updateDraftFilter('brand', brand)}
                >
                  {brand}
                </Button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section-title">Giá</div>
            <div className="filter-grid">
              {priceOptions.map((option) => {
                const active = draftFilters.minPrice === option.minPrice && draftFilters.maxPrice === option.maxPrice;
                return (
                  <Button
                    key={option.label}
                    size="sm"
                    variant={active ? 'primary' : 'outline-secondary'}
                    className="filter-chip"
                    onClick={() => updatePriceFilter(option)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section-title">Nhu cầu sử dụng</div>
            <div className="filter-grid">
              {usageOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={draftFilters.usage === option.value ? 'primary' : 'outline-secondary'}
                  className="filter-chip"
                  onClick={() => updateDraftFilter('usage', option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <div className="filter-section-title">CPU</div>
            <div className="filter-grid">
              {cpuOptions.map((cpu) => (
                <Button
                  key={cpu.value}
                  size="sm"
                  variant={draftFilters.cpu === cpu.value ? 'primary' : 'outline-secondary'}
                  className="filter-chip"
                  onClick={() => updateDraftFilter('cpu', cpu.value)}
                >
                  {cpu.label}
                </Button>
              ))}
            </div>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <div className="filter-section mb-0">
                <div className="filter-section-title">RAM</div>
                <div className="filter-grid compact">
                  {ramOptions.map((ram) => (
                    <Button
                      key={ram}
                      size="sm"
                      variant={draftFilters.ram === ram ? 'primary' : 'outline-secondary'}
                      className="filter-chip"
                      onClick={() => updateDraftFilter('ram', ram)}
                    >
                      {ram}
                    </Button>
                  ))}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="filter-section mb-0">
                <div className="filter-section-title">Ổ cứng</div>
                <div className="filter-grid compact">
                  {storageOptions.map((storage) => (
                    <Button
                      key={storage}
                      size="sm"
                      variant={draftFilters.storage === storage ? 'primary' : 'outline-secondary'}
                      className="filter-chip"
                      onClick={() => updateDraftFilter('storage', storage)}
                    >
                      {storage}
                    </Button>
                  ))}
                </div>
              </div>
            </Col>
          </Row>

          <Row className="g-3 mt-1">
            <Col md={6}>
              <div className="filter-section mb-0">
                <div className="filter-section-title">Kích thước màn hình</div>
                <div className="filter-grid compact">
                  {screenSizeOptions.map((screenSize) => (
                    <Button
                      key={screenSize}
                      size="sm"
                      variant={draftFilters.screenSize === screenSize ? 'primary' : 'outline-secondary'}
                      className="filter-chip"
                      onClick={() => updateDraftFilter('screenSize', screenSize)}
                    >
                      {screenSize} inch
                    </Button>
                  ))}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="filter-section mb-0">
                <div className="filter-section-title">Card đồ họa (GPU)</div>
                <div className="filter-grid compact">
                  {gpuTypeOptions.map((gpuType) => (
                    <Button
                      key={gpuType.value}
                      size="sm"
                      variant={draftFilters.gpuType === gpuType.value ? 'primary' : 'outline-secondary'}
                      className="filter-chip"
                      onClick={() => updateDraftFilter('gpuType', gpuType.value)}
                    >
                      {gpuType.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={clearFilters} disabled={!hasActiveFilters && !hasDraftFilters}>
            Xóa lọc
          </Button>
          <Button variant="primary" onClick={applyFilters}>
            Áp dụng lọc
          </Button>
        </Modal.Footer>
      </Modal>

      <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-3">
        {products.map((p) => (
          <Col key={p._id}>
            <Card
              className="h-100 product-card product-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => goToProductDetail(p._id)}
            >
              <div className="product-img-wrap">
                <Card.Img variant="top" src={getPrimaryImage(p)} alt={p.name} />
              </div>
              <Card.Body className="product-card-body">
                <Card.Title className="product-name">{p.name}</Card.Title>
                <div className="product-specs">
                  <span>RAM {p.ram || 'Đang cập nhật'}</span>
                  <span>{p.storage || 'Đang cập nhật'}</span>
                </div>
                <div>
                  <div className="product-price">{formatCurrency(p.price)}</div>
                  {hasOriginalPrice(p) && (
                    <div className="product-original-price">
                      <span>{formatCurrency(p.originalPrice)}</span>
                      {p.discount ? <strong>-{p.discount}%</strong> : null}
                    </div>
                  )}
                </div>
                <div className="product-actions">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={p.status === 'outOfStock' || p.stock === 0}
                    onClick={(event) => handleAddToCart(event, p)}
                  >
                    {p.status === 'outOfStock' || p.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </Button>
                  <Button
                    size="sm"
                    variant={compareIds.includes(String(p._id)) ? 'primary' : 'outline-primary'}
                    onClick={(event) => toggleCompare(event, p._id)}
                  >
                    So sánh
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {!loading && !products.length && (
        <div className="empty-products">
          Không tìm thấy laptop phù hợp. Hãy thử bỏ bớt bộ lọc hoặc đổi khoảng giá.
        </div>
      )}

      {remaining > 0 && (
        <div className="load-more-wrap">
          <Button variant="outline-primary" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Đang tải...' : `Xem thêm ${remaining} laptop`}
          </Button>
        </div>
      )}

      {compareIds.length > 0 && (
        <div className="compare-bar">
          <div>
            <strong>{compareIds.length}/{MAX_COMPARE}</strong> sản phẩm để so sánh
            {compareMessage && <div className="compare-message">{compareMessage}</div>}
          </div>
          <div className="compare-bar-actions">
            <Button size="sm" variant="outline-secondary" onClick={clearCompare}>Xóa</Button>
            <Button size="sm" variant="primary" onClick={goToCompare}>So sánh</Button>
          </div>
        </div>
      )}
    </Container>
  );
}
