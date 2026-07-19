import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { cachedRequest, clearApiCache, request } from '../api/api';
import BookingWizard from '../components/customer/BookingWizard';

interface Appointment {
  appointment_id: string;
  barber_id: string;
  client_id: string;
  appointment_date: string;
  status: string;
  notes: string;
  start_time: string;
  end_time: string;
  barbershop_id: string;
}

interface ResolvedAppointment extends Appointment {
  barber_name: string;
  service_name: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'my-appointments' | 'book-appointment' | 'profile'>('my-appointments');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<ResolvedAppointment[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Errors and success
  const [error, setError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Invitation states
  const [showInvitationPrompt, setShowInvitationPrompt] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [claimingInvite, setClaimingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  
  const navigate = useNavigate();

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await cachedRequest<UserProfile>('/users/me', 120000);
        setUserProfile(profile);
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setError(null);

        const hideInvite = localStorage.getItem('hide_barber_invite') === 'true';
        if (!hideInvite) {
          setShowInvitationPrompt(true);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError('No se pudo verificar la sesión. Inicie sesión de nuevo.');
        handleLogout();
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  // Load appointments
  const fetchAppointments = async () => {
    if (!userProfile) return;
    setLoadingAppointments(true);
    setError(null);
    try {
      // 1. Fetch raw appointments
      const rawApps = await request<Appointment[]>("GET", '/appointments');
      
      // 2. Fetch master data to resolve names
      const barbersRes = await cachedRequest<{ data: any[] }>('/api/customer/barbers', 300000).catch(() => ({ data: [] }));
      const barbersMap = new Map(barbersRes.data.map(b => [b.id, b.full_name]));
      
      // 3. Resolve each appointment details (linked services)
      const resolvedList: ResolvedAppointment[] = await Promise.all(
        rawApps.map(async (app) => {
          let service_name = 'Servicio';
          try {
            const services = await request<any[]>("GET", `/appointments/${app.appointment_id}/services`);
            if (services && services.length > 0) {
              service_name = services[0].name || services[0].service?.name || 'Servicio';
            }
          } catch (e) {
            console.error(`Failed to load services for appointment ${app.appointment_id}:`, e);
          }
          return {
            ...app,
            barber_name: barbersMap.get(app.barber_id) || 'Barbero',
            service_name
          };
        })
      );
      
      // Sort: active/pending first, then date descending
      resolvedList.sort((a, b) => {
        if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
        if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
        return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
      });

      setAppointments(resolvedList);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setError('Error al cargar la agenda de citas.');
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (userProfile && activeTab === 'my-appointments') {
      fetchAppointments();
    }
  }, [userProfile, activeTab]);

  const handleCancelAppointment = async (appId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setCancellingId(appId);
    setError(null);
    
    try {
      await request('DELETE', `/appointments/${appId}`);
      clearApiCache();
      await fetchAppointments();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la cita.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setSavingProfile(true);
    setProfileSuccess(false);
    setError(null);

    try {
      const updated = await request('PUT', `/users/${userProfile.id}`, {
        full_name: fullName,
        phone: phone || undefined
      });
      setUserProfile(updated);
      localStorage.setItem('user_name', updated.full_name);
      clearApiCache();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    clearApiCache();
    navigate('/');
  };

  const handleClaimInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setClaimingInvite(true);
    try {
      await request('POST', '/barbershops/invitations/claim', {
        code: inviteCode.trim().toUpperCase()
      });
      
      setInviteSuccess(true);
      localStorage.setItem('user_role', 'barber');
      clearApiCache();
      
      setTimeout(() => {
        navigate('/barber/dashboard');
      }, 2000);
    } catch (err: any) {
      setInviteError(err.message || 'Código de invitación inválido o expirado.');
    } finally {
      setClaimingInvite(false);
    }
  };

  const handleBookingSuccess = () => {
    setActiveTab('my-appointments');
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-obsidian flex justify-center items-center">
        <Loader className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  const avatarUrl = userProfile?.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'Cliente')}&background=222&color=D4AF37&size=100`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-main)' }}>
      {/* Mobile Sidebar Toggle */}
      <button 
        className="sidebar-toggle" 
        aria-label="Abrir o cerrar menú lateral"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      {/* Sidebar Navigation */}
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand-text">
          <i className="fa-solid fa-scissors"></i> SHARKHUB
        </div>

        <button 
          onClick={() => { setActiveTab('my-appointments'); setIsSidebarOpen(false); }}
          className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'my-appointments' ? 'active' : ''}`}
          style={{ cursor: 'pointer' }}
        >
          <i className="fa-regular fa-calendar-check me-2"></i> Mis Citas
        </button>
        <button 
          onClick={() => { setActiveTab('book-appointment'); setIsSidebarOpen(false); }}
          className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'book-appointment' ? 'active' : ''}`}
          style={{ cursor: 'pointer' }}
        >
          <i className="fa-solid fa-calendar-plus me-2"></i> Agendar Cita
        </button>
        <button 
          onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
          className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'profile' ? 'active' : ''}`}
          style={{ cursor: 'pointer' }}
        >
          <i className="fa-solid fa-user-pen me-2"></i> Perfil
        </button>

        <button 
          onClick={handleLogout} 
          className="nav-link logout-mt text-start bg-transparent border-0 w-100" 
          id="btnLogout"
          style={{ cursor: 'pointer' }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket me-2"></i> Cerrar sesión
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="page-header d-flex justify-between align-items-center">
          <div>
            <h2 className="text-white mb-0" style={{ letterSpacing: '1px' }}>
              {activeTab === 'my-appointments' && 'Mis Citas'}
              {activeTab === 'book-appointment' && 'Agendar Cita'}
              {activeTab === 'profile' && 'Perfil'}
            </h2>
            <p className="text-muted mb-0 text-start" style={{ fontSize: '0.9rem' }}>
              {activeTab === 'my-appointments' && 'Gestiona tus citas de barbería próximas.'}
              {activeTab === 'book-appointment' && 'Agenda tus citas y accede a los servicios disponibles.'}
              {activeTab === 'profile' && 'Edita tu información de perfil y de contacto.'}
            </p>
          </div>
          <div className="user-profile d-flex align-items-center gap-3">
            <span className="d-none d-sm-block font-weight-bold" id="customerName" style={{ color: 'var(--text-main)' }}>
              {userProfile?.full_name}
            </span>
            <img src={avatarUrl} alt="Client" className="avatar" id="customerAvatar" />
          </div>
        </header>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-4 text-sm flex gap-3 items-center mb-4 max-w-2xl rounded-3">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Sections */}
        
        {/* Tab: My Appointments */}
        {activeTab === 'my-appointments' && (
          <section id="my-appointments" className="content-section active text-start">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="section-title mb-0">Citas Próximas</h3>
              <button
                onClick={fetchAppointments}
                className="btn btn-outline-secondary text-white btn-sm"
                title="Recargar citas"
                disabled={loadingAppointments}
              >
                <RefreshCw size={14} className={loadingAppointments ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingAppointments ? (
              <p className="text-muted empty-appointments-message">Cargando citas...</p>
            ) : appointments.length === 0 ? (
              <p className="text-muted empty-appointments-message">Todavía no tienes citas registradas.</p>
            ) : (
              <div className="appointments-list">
                {appointments.map((app) => (
                  <div key={app.appointment_id} className="appointment-card flex-column flex-sm-row gap-3">
                    <div className="d-flex align-items-center gap-4">
                      <div className="apt-date">
                        <h3>{app.appointment_date.split('-')[2]}</h3>
                        <span>{new Date(app.appointment_date + 'T00:00:00').toLocaleDateString('es-EC', { month: 'short' })}</span>
                      </div>
                      <div className="apt-details">
                        <h4 className="text-white mb-1" style={{ fontSize: '1.25rem' }}>{app.service_name}</h4>
                        <p className="mb-0">
                          <i className="fa-regular fa-clock me-2 text-gold"></i>
                          {app.start_time.slice(0, 5)} - con {app.barber_name}
                        </p>
                        {app.notes && (
                          <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                            Nota: "{app.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="d-flex align-items-center gap-3 self-end self-sm-center">
                      {app.status === 'confirmed' && <span className="badge bg-success" style={{ padding: '8px 15px' }}>Confirmado</span>}
                      {app.status === 'cancelled' && <span className="badge bg-danger" style={{ padding: '8px 15px' }}>Cancelado</span>}
                      {app.status !== 'confirmed' && app.status !== 'cancelled' && (
                        <span className="badge bg-warning text-dark" style={{ padding: '8px 15px' }}>Pendiente</span>
                      )}
                      
                      {app.status !== 'cancelled' && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleCancelAppointment(app.appointment_id)}
                          disabled={cancellingId === app.appointment_id}
                          style={{ borderRadius: '4px' }}
                        >
                          {cancellingId === app.appointment_id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab: Book Appointment */}
        {activeTab === 'book-appointment' && (
          <section id="book-appointment" className="content-section active text-start">
            <h3 className="section-title">Agendar Nueva Cita</h3>
            <BookingWizard onSuccess={handleBookingSuccess} />
          </section>
        )}

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <section id="profile" className="content-section active text-start">
            <h3 className="section-title">Mi Perfil</h3>

            {profileSuccess && (
              <div className="alert alert-success bg-success/20 border-success/30 text-success mb-4" role="alert">
                Perfil actualizado correctamente.
              </div>
            )}

            <div className="panel-card dashboard-form">
              <form onSubmit={handleUpdateProfile}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label text-muted">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={savingProfile}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted">Correo electrónico</label>
                    <input
                      type="email"
                      className="form-control bg-dark text-muted"
                      value={userProfile?.email || ''}
                      readOnly
                      style={{ cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={savingProfile}
                      placeholder="+593 99 999 9999"
                    />
                  </div>
                  <div className="col-12 text-end mt-4">
                    <button type="submit" className="btn btn-gold" disabled={savingProfile}>
                      {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>

      {showInvitationPrompt && (
        <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050 }}>
          <div className="panel-card p-5 text-center" style={{ maxWidth: '500px', width: '90%', border: '1px solid var(--primary-gold)' }}>
            <i className="fa-solid fa-scissors mb-3 text-gold" style={{ fontSize: '3rem' }}></i>
            <h3 className="font-heading text-white mb-2" style={{ letterSpacing: '1px' }}>¿ERES BARBERO EN SHARKHUB?</h3>
            <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
              Si tu administrador te otorgó un código de invitación para unirte a la barbería, ingrésalo a continuación para activar tu cuenta de Barbero.
            </p>
            
            {inviteError && (
              <div className="alert alert-danger bg-danger/10 border-danger/30 text-danger p-2 mb-3 text-start" style={{ fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-exclamation me-2"></i> {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="alert alert-success bg-success/10 border-success/30 text-success p-2 mb-3 text-start" style={{ fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-check me-2"></i> ¡Código verificado! Configurando tu cuenta de barbero...
              </div>
            )}

            <form onSubmit={handleClaimInvitation} className="mb-4">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control text-center text-uppercase font-heading font-weight-bold"
                  placeholder="Ej: SH-000-XXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  disabled={claimingInvite || inviteSuccess}
                  style={{ letterSpacing: '2px', fontSize: '1.2rem', borderColor: 'var(--border-color)', color: 'var(--text-main)', background: '#222' }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-gold w-100 p-2 font-weight-bold"
                disabled={claimingInvite || inviteSuccess}
              >
                {claimingInvite ? 'Verificando...' : 'Activar Cuenta de Barbero'}
              </button>
            </form>

            <button
              type="button"
              className="btn btn-link text-muted text-decoration-none"
              style={{ fontSize: '0.9rem' }}
              onClick={() => {
                localStorage.setItem('hide_barber_invite', 'true');
                setShowInvitationPrompt(false);
              }}
              disabled={claimingInvite || inviteSuccess}
            >
              No tengo código, continuar como Cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
