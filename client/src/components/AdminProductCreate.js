import React, { useMemo, useState, useEffect } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import api from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const initialForm = {
  name: '',
  price: '',
  originalPrice: '',
  discount: '',
  brand: '',
  cpu: '',
  ram: '',
  storage: '',
  gpu: '',
  screen: '',
  warranty: '',
  stock: '',
  condition: 'new',
  usage: [],
  status: 'active',
  description: '',
};

const conditionOptions = [
  { value: 'new', label: 'Mới' },
  { value: 'likeNew', label: 'Like new' },
  { value: 'used', label: 'Đã qua sử dụng' },
];

const usageOptions = [
  { value: 'student', label: 'Học tập' },
  { value: 'office', label: 'Văn phòng' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'design', label: 'Đồ họa' },
  { value: 'premium', label: 'Cao cấp' },
];

const statusOptions = [
  { value: 'active', label: 'Đang bán' },
  { value: 'outOfStock', label: 'Hết hàng' },
  { value: 'hidden', label: 'Ẩn' },
];

const toOptionalNumber = (value) => {
  if (value === '' || value == null) return undefined;
  return Number(value);
};

export default function AdminProductCreate() {
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const hasUploadedImages = uploadedImages.length > 0;
  const selectedNames = useMemo(() => files.map((file) => file.name).join(', '), [files]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'usage' && type === 'checkbox') {
      setForm((current) => {
        const cur = Array.isArray(current.usage) ? current.usage.slice() : [];
        if (checked) {
          if (!cur.includes(value)) cur.push(value);
        } else {
          const idx = cur.indexOf(value);
          if (idx !== -1) cur.splice(idx, 1);
        }
        return { ...current, usage: cur };
      });
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
    setUploadedImages([]);
    setError('');
    setSuccess('');
  };

  const handleUploadImages = async () => {
    if (!files.length) {
      setError('Chọn ít nhất 1 ảnh trước khi tải lên.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const payload = new FormData();
      files.forEach((file) => payload.append('images', file));

      const response = await api.post('/api/uploads/products', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedImages(response.data.images || []);
      setSuccess('Tải ảnh thành công. Bây giờ bạn có thể lưu sản phẩm.');
    } catch (err) {
      setError(err.response?.data?.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasUploadedImages) {
      setError('Bạn cần tải ảnh lên trước khi lưu sản phẩm.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const imageUrls = uploadedImages.map((image) => image.url);
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: toOptionalNumber(form.originalPrice),
        discount: toOptionalNumber(form.discount) || 0,
        stock: toOptionalNumber(form.stock) || 0,
        image: imageUrls[0],
        images: imageUrls,
      };

      if (isEdit) {
        await api.put(`/api/products/${id}`, payload);
        setSuccess('Cập nhật sản phẩm thành công.');
        navigate('/admin/products');
      } else {
        await api.post('/api/products', payload);
        setForm(initialForm);
        setFiles([]);
        setUploadedImages([]);
        setSuccess('Đã tạo sản phẩm mới thành công.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu sản phẩm thất bại');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!isEdit) {
        setForm(initialForm);
        setFiles([]);
        setUploadedImages([]);
        setError('');
        setSuccess('');
        setSaving(false);
        setUploading(false);
        return;
      }

      try {
        setSaving(true);
        setError('');
        setSuccess('');
        const res = await api.get(`/api/products/admin/${id}`);
        const p = res.data;
        setForm({
          name: p.name || '',
          price: p.price != null ? String(p.price) : '',
          originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
          discount: p.discount != null ? String(p.discount) : '',
          brand: p.brand || '',
          cpu: p.cpu || '',
          ram: p.ram || '',
          storage: p.storage || '',
          gpu: p.gpu || '',
          screen: p.screen || '',
          warranty: p.warranty || '',
          stock: p.stock != null ? String(p.stock) : '',
          condition: p.condition || 'new',
          usage: Array.isArray(p.usage) ? p.usage : p.usage ? [p.usage] : [],
          status: p.status || 'active',
          description: p.description || '',
        });
        const imgs = Array.isArray(p.images) ? p.images : p.image ? [p.image] : [];
        setUploadedImages(imgs.map((url, i) => ({ url, publicId: `existing-${i}` })));
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được sản phẩm');
      } finally {
        setSaving(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  return (
    <div className="admin-page py-4">
      <div className="admin-header mb-4">
        <h2 className="mb-2">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
        <p className="text-muted mb-0">
          Nhập thông tin bán hàng, cấu hình laptop và tải ảnh sản phẩm.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="g-4 align-items-start">
        <Col lg={7}>
          <Card className="admin-card">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group controlId="productName">
                      <Form.Label>Tên sản phẩm</Form.Label>
                      <Form.Control name="name" value={form.name} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="productBrand">
                      <Form.Label>Thương hiệu</Form.Label>
                      <Form.Control name="brand" value={form.brand} onChange={handleChange} required />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group controlId="productPrice">
                      <Form.Label>Giá bán</Form.Label>
                      <Form.Control name="price" value={form.price} onChange={handleChange} type="number" min="0" step="1000" required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="productOriginalPrice">
                      <Form.Label>Giá gốc</Form.Label>
                      <Form.Control name="originalPrice" value={form.originalPrice} onChange={handleChange} type="number" min="0" step="1000" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="productDiscount">
                      <Form.Label>Giảm giá (%)</Form.Label>
                      <Form.Control name="discount" value={form.discount} onChange={handleChange} type="number" min="0" max="100" />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="productCpu">
                      <Form.Label>CPU</Form.Label>
                      <Form.Control name="cpu" value={form.cpu} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="productGpu">
                      <Form.Label>GPU</Form.Label>
                      <Form.Control name="gpu" value={form.gpu} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="productRam">
                      <Form.Label>RAM</Form.Label>
                      <Form.Control name="ram" value={form.ram} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="productStorage">
                      <Form.Label>Ổ cứng / lưu trữ</Form.Label>
                      <Form.Control name="storage" value={form.storage} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="productScreen">
                      <Form.Label>Màn hình</Form.Label>
                      <Form.Control name="screen" value={form.screen} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="productWarranty">
                      <Form.Label>Bảo hành</Form.Label>
                      <Form.Control name="warranty" value={form.warranty} onChange={handleChange} />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group controlId="productStock">
                      <Form.Label>Tồn kho</Form.Label>
                      <Form.Control name="stock" value={form.stock} onChange={handleChange} type="number" min="0" />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="productCondition">
                      <Form.Label>Tình trạng</Form.Label>
                      <Form.Select name="condition" value={form.condition} onChange={handleChange}>
                        {conditionOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="productUsage">
                      <Form.Label>Nhu cầu</Form.Label>
                      <div>
                        {usageOptions.map((option) => (
                          <Form.Check
                            key={option.value}
                            type="checkbox"
                            id={`usage-${option.value}`}
                            name="usage"
                            value={option.value}
                            label={option.label}
                            checked={Array.isArray(form.usage) && form.usage.includes(option.value)}
                            onChange={handleChange}
                          />
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="productStatus">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select name="status" value={form.status} onChange={handleChange}>
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group controlId="productDescription">
                      <Form.Label>Mô tả sản phẩm</Form.Label>
                      <Form.Control as="textarea" rows={4} name="description" value={form.description} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <div className="d-flex gap-2 justify-content-end">
                      <Button type="button" variant="outline-primary" onClick={handleUploadImages} disabled={uploading || !files.length}>
                        {uploading ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
                      </Button>
                      <Button type="submit" variant="primary" disabled={saving || !hasUploadedImages}>
                        {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="admin-card">
            <Card.Body>
              <Form.Group controlId="productImages" className="mb-3">
                <Form.Label>Thư viện ảnh</Form.Label>
                <Form.Control key={id || 'new-product-images'} type="file" accept="image/*" multiple onChange={handleFileChange} />
                <Form.Text className="text-muted">
                  Tối đa 5 ảnh, mỗi ảnh không quá 5MB.
                </Form.Text>
              </Form.Group>

              <div className="small text-muted mb-3">
                {selectedNames || 'Chưa có tệp ảnh nào được chọn.'}
              </div>

              <div className="admin-image-grid">
                {uploadedImages.map((image) => (
                  <div className="admin-image-tile" key={image.publicId}>
                    <img src={image.url} alt={image.publicId} />
                  </div>
                ))}
              </div>

              {!uploadedImages.length && (
                <div className="admin-empty-state">
                  Ảnh sau khi tải lên sẽ hiển thị ở đây. Ảnh đầu tiên sẽ được dùng làm ảnh chính của sản phẩm.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
