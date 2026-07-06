import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ChevronLeft, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { request } from '../../api/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await request('POST', '/auth/register', {
        name,
        email,
        password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al registrarse. Intente con otro correo.');
    } finally {
      setLoading(false);
    }
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
                  Crear Cuenta
                </h2>
                <p className="text-center text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                  Regístrate para agendar tus citas en línea
                </p>
              </div>

              {error && (
                <div className="alert alert-danger bg-danger/10 border border-danger/30 text-danger p-3 mb-4 rounded d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success bg-success/10 border border-success/30 text-success p-3 mb-4 rounded d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                  <CheckCircle size={18} className="shrink-0" />
                  <span>¡Registro exitoso! Redirigiendo al login...</span>
                </div>
              )}

              <form id="registerForm" onSubmit={handleRegister} className="text-start">
                <div className="form-group mb-3">
                  <label className="form-label-custom mb-2">Nombre completo</label>
                  <div className="position-relative">
                    <span className="position-absolute start-0 top-50 translate-y-50 ps-3 text-muted" style={{ transform: 'translateY(-50%)', top: '50%' }}>
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-control form-control-custom ps-5"
                      placeholder="Juan Pérez"
                      disabled={loading || success}
                      style={{ paddingLeft: '45px' }}
                    />
                  </div>
                </div>

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
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control form-control-custom ps-5"
                      placeholder="ejemplo@correo.com"
                      disabled={loading || success}
                      style={{ paddingLeft: '45px' }}
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label-custom mb-2">Contraseña</label>
                  <div className="position-relative">
                    <span className="position-absolute start-0 top-50 translate-y-50 ps-3 text-muted" style={{ transform: 'translateY(-50%)', top: '50%' }}>
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control form-control-custom ps-5"
                      placeholder="Mínimo 6 caracteres"
                      disabled={loading || success}
                      style={{ paddingLeft: '45px' }}
                    />
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label-custom mb-2">Confirmar contraseña</label>
                  <div className="position-relative">
                    <span className="position-absolute start-0 top-50 translate-y-50 ps-3 text-muted" style={{ transform: 'translateY(-50%)', top: '50%' }}>
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control form-control-custom ps-5"
                      placeholder="Repite tu contraseña"
                      disabled={loading || success}
                      style={{ paddingLeft: '45px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-custom w-100"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin d-inline-block me-2" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Registrarse <i className="fas fa-user-plus ms-2"></i>
                    </>
                  )}
                </button>
              </form>

              <div className="form-footer text-center mt-4" style={{ fontSize: '0.9rem', color: '#aaa' }}>
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" style={{ color: 'var(--primary-gold)', textDecoration: 'none', fontWeight: 'bold' }}>
                  Inicia sesión aquí
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
