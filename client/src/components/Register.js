import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Form, Button, Alert, Card, Row, Col, FloatingLabel } from 'react-bootstrap';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      await googleLogin(credential);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký Google thất bại');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <Card style={{ maxWidth: 920, width: '100%' }}>
        <Row className="g-0">
          <Col md={5} className="d-none d-md-block" style={{ background: 'linear-gradient(135deg,#fff7ed,#fff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <h4 style={{ marginBottom: 8 }}>Chào mừng đến với LaptopHouse</h4>
              <p className="text-muted small">Tạo tài khoản để nhận ưu đãi, theo dõi đơn hàng và lưu thông tin mua sắm</p>
              <img
                src="/register.jpg"
                alt="Register"
                style={{ width: '100%', maxWidth: 360, height: 'auto', objectFit: 'contain', borderRadius: 20 }}
              />
            </div>
          </Col>
          <Col md={7} xs={12}>
            <Card.Body style={{ padding: 32 }}>
              <h3 className="mb-3">Đăng ký</h3>
              {error && <Alert variant="danger">{error}</Alert>}

              <div className="mb-3">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Đăng ký Google thất bại')}
                  text="signup_with"
                  width="100%"
                />
              </div>

              <div className="text-center text-muted small mb-3">hoặc</div>

              <Form onSubmit={submit}>
                <FloatingLabel label="Họ và tên" className="mb-3">
                  <Form.Control value={name} onChange={e => setName(e.target.value)} placeholder="Họ và tên" required />
                </FloatingLabel>

                <FloatingLabel label="Email" className="mb-3">
                  <Form.Control value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="name@example.com" required />
                </FloatingLabel>

                <FloatingLabel label="Mật khẩu" className="mb-3">
                  <Form.Control value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Mật khẩu" required />
                </FloatingLabel>

                <div className="d-grid">
                  <Button type="submit" variant="primary">Tạo tài khoản</Button>
                </div>
              </Form>

              <div className="mt-3 text-center small text-muted">
                Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
              </div>
            </Card.Body>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
