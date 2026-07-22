import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Lock, Mail, ChevronLeft, AlertCircle, Loader } from 'lucide-react';
import { clearApiCache, request } from '../../api/api';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await request('POST', '/auth/login', {
        email,
        password,
      });

      // Save credentials in storage
      localStorage.setItem('token', res.token);
      localStorage.setItem('user_id', res.user.id);
      localStorage.setItem('user_name', res.user.name);
      localStorage.setItem('user_email', res.user.email);
      localStorage.setItem('barbershop_id', res.user.barbershop_id || '');
      localStorage.setItem('session_created_at', Date.now().toString());

      // Limpia únicamente caché privada de sesiones anteriores.
      // La caché pública de la página principal se conserva.
      clearApiCache();
      
      // Resolve user role from JWT token payload
      const decoded = parseJwt(res.token);
      const role = decoded?.role || 'customer';
      localStorage.setItem('user_role', role);

      if (role === 'customer') {
        navigate('/customer/dashboard');
      } else if (role === 'barber') {
        navigate('/barber/dashboard');
      } else if (role === 'owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/customer/dashboard'); // default
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      const isConnectionError =
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('networkerror');

      setError(
        isConnectionError
          ? 'No fue posible conectar con el servidor. Inténtalo nuevamente.'
          : 'Correo electrónico y/o contraseña incorrectos.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    setLoading(true);
    const idToken = credentialResponse.credential;

    try {
      const res = await request('POST', '/auth/google', {
        id_token: idToken,
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('user_id', res.user.id);
      localStorage.setItem('user_name', res.user.name);
      localStorage.setItem('user_email', res.user.email);
      localStorage.setItem('barbershop_id', res.user.barbershop_id || '');
      localStorage.setItem('session_created_at', Date.now().toString());

      // Limpia únicamente caché privada de sesiones anteriores.
      // La caché pública de la página principal se conserva.
      clearApiCache();

      // Resolve user role from JWT token payload
      const decoded = parseJwt(res.token);
      const role = decoded?.role || 'customer';
      localStorage.setItem('user_role', role);

      if (role === 'customer') {
        navigate('/customer/dashboard');
      } else if (role === 'barber') {
        navigate('/barber/dashboard');
      } else if (role === 'owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(message || 'Error de autenticación con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError('Error de conexión con la cuenta de Google. Verifica los orígenes autorizados.');
  };

  return (
    <main 
      id="main-content" 
      className="d-flex align-items-center justify-content-center px-3" 
      style={{ minHeight: '100vh', backgroundColor: '#121212', position: 'relative' }}
    >
      {/* Back button */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 text-text-muted hover:text-white d-flex align-items-center gap-1 font-heading text-sm text-uppercase text-decoration-none"
        style={{ position: 'absolute', top: '30px', left: '30px', color: '#aaa', transition: 'color 0.2s' }}
      >
        <ChevronLeft size={16} /> Volver a Inicio
      </Link>

      <div className="container">
        <div className="row justify-content-center w-100 m-0">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="form-wrapper mx-auto w-100"
            >
              <div className="form-header text-center mb-4">
                <img 
                  src="/img/BarberShop_PandaBlackAndWhite.png" 
                  alt="PANDA Logo" 
                  className="h-16 w-auto mx-auto mb-3" 
                  style={{ height: '64px' }} 
                />
                <h2 className="text-center text-white text-uppercase font-heading mb-1" style={{ letterSpacing: '2px' }}>
                  Iniciar Sesión
                </h2>
                <p className="text-center text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                  Ingresa tus credenciales para continuar
                </p>
              </div>

              {error && (
                <div className="alert alert-danger bg-danger/10 border border-danger/30 text-danger p-3 mb-4 rounded d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google OAuth Login Wrapper */}
              <div className="w-100 d-flex flex-column align-items-center mb-3">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  theme="filled_black"
                  shape="rectangular"
                  text="signin_with"
                  width="350"
                />
              </div>

              <div className="text-center mb-4 position-relative d-flex align-items-center justify-content-center">
                <hr className="w-100 border-secondary m-0" />
                <span 
                  className="position-absolute px-3 bg-secondary text-muted text-uppercase" 
                  style={{ fontSize: '0.75rem', letterSpacing: '1px', backgroundColor: '#1e1e1e' }}
                >
                  o usa tu correo electrónico
                </span>
              </div>

              <form id="loginForm" onSubmit={handleTraditionalLogin} className="text-start">
                <div className="form-group mb-3">
                  <label className="form-label-custom mb-2">Correo electrónico</label>
                  <div className="position-relative">
                    <span className="position-absolute start-0 top-50 translate-y-50 ps-3 text-muted" style={{ transform: 'translateY(-50%)', top: '50%' }}>
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      className="form-control form-control-custom ps-5"
                      placeholder="ejemplo@correo.com"
                      disabled={loading}
                      style={{ paddingLeft: '45px' }}
                    />
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-custom mb-2">Contraseña</label>
                  <div className="position-relative">
                    <span className="position-absolute start-0 top-50 translate-y-50 ps-3 text-muted" style={{ transform: 'translateY(-50%)', top: '50%' }}>
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="form-control form-control-custom ps-5"
                      placeholder="••••••••"
                      disabled={loading}
                      style={{ paddingLeft: '45px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-custom w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin d-inline-block me-2" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión <i className="fas fa-sign-in-alt ms-2"></i>
                    </>
                  )}
                </button>
              </form>

              <div className="form-footer text-center mt-4" style={{ fontSize: '0.9rem', color: '#aaa' }}>
                ¿No tienes una cuenta?{' '}
                <Link to="/register" style={{ color: 'var(--primary-gold)', textDecoration: 'none', fontWeight: 'bold' }}>
                  Regístrate aquí
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
