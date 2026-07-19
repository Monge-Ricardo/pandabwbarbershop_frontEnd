import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, RefreshCw, Scissors, Ticket, Users } from 'lucide-react';
import { cachedRequest, clearApiCache, request } from '../../api/api';

type OwnerTab = 'overview' | 'barbershop' | 'barbers' | 'appointments' | 'invitations';
type EntityStatus = 'active' | 'inactive';
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | string;

interface ApiListResponse<T> {
  data?: T;
}

interface UserProfile {
  id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
}

interface Barbershop {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  logo_url?: string;
}

interface BarberMember {
  membership_id?: string;
  member_id?: string;
  id?: string;
  user_id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: EntityStatus | string;
}

interface AppointmentService {
  name?: string;
}

interface AppointmentPerson {
  full_name?: string;
  name?: string;
  email?: string;
}

interface OwnerAppointment {
  id?: string;
  appointment_id?: string;
  client_id?: string;
  barber_id?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  status?: AppointmentStatus;
  notes?: string;
  client?: AppointmentPerson;
  barber?: AppointmentPerson;
  service?: AppointmentService;
  services?: AppointmentService[];
  client_name?: string;
  barber_name?: string;
  service_name?: string;
}

interface InvitationCode {
  invitation_id?: string;
  id?: string;
  code?: string;
  expires_at?: string | null;
  is_active?: boolean;
}

interface BarbershopFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  logo_url: string;
}

function unwrapData<T>(payload: T | ApiListResponse<T> | null | undefined, fallback: T): T {
  if (!payload) return fallback;
  if (typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as ApiListResponse<T>;
    return wrapped.data ?? fallback;
  }
  return payload as T;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(value?: string): string {
  if (!value) return '--:--';
  return value.slice(0, 5);
}

function formatDate(value?: string): string {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatAppointmentStatus(status?: string): string {
  if (status === 'confirmed') return 'Confirmada';
  if (status === 'cancelled') return 'Cancelada';
  return 'Pendiente';
}

function appointmentStatusClass(status?: string): string {
  if (status === 'confirmed') return 'status-badge status-confirmed';
  if (status === 'cancelled') return 'status-badge status-cancelled';
  return 'status-badge status-pending';
}

function memberStatusClass(status?: string): string {
  return status === 'active' ? 'status-badge status-confirmed' : 'status-badge status-cancelled';
}

function memberId(barber: BarberMember): string {
  return barber.membership_id || barber.member_id || barber.id || '';
}

function barberName(barber: BarberMember): string {
  return barber.full_name || barber.name || 'Barbero';
}

function appointmentId(appointment: OwnerAppointment): string {
  return appointment.id || appointment.appointment_id || '';
}

function appointmentClientName(appointment: OwnerAppointment): string {
  return appointment.client_name || appointment.client?.full_name || appointment.client?.name || 'Cliente';
}

function appointmentBarberName(appointment: OwnerAppointment, barbers: BarberMember[]): string {
  if (appointment.barber_name) return appointment.barber_name;
  if (appointment.barber?.full_name || appointment.barber?.name) {
    return appointment.barber.full_name || appointment.barber.name || 'Barbero';
  }
  const found = barbers.find((barber) => barber.user_id === appointment.barber_id || barber.id === appointment.barber_id);
  return found ? barberName(found) : 'Barbero';
}

function appointmentServiceName(appointment: OwnerAppointment): string {
  if (appointment.service_name) return appointment.service_name;
  if (appointment.service?.name) return appointment.service.name;
  if (appointment.services && appointment.services.length > 0) {
    return appointment.services.map((service) => service.name).filter(Boolean).join(', ') || 'Servicio';
  }
  return 'Servicio';
}

function emptyBarbershopForm(): BarbershopFormState {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    logo_url: '',
  };
}

function mapBarbershopToForm(barbershop: Barbershop | null): BarbershopFormState {
  return {
    name: barbershop?.name || '',
    phone: barbershop?.phone || '',
    email: barbershop?.email || '',
    address: barbershop?.address || '',
    description: barbershop?.description || '',
    logo_url: barbershop?.logo_url || '',
  };
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [barbershopForm, setBarbershopForm] = useState<BarbershopFormState>(emptyBarbershopForm());
  const [barbers, setBarbers] = useState<BarberMember[]>([]);
  const [appointments, setAppointments] = useState<OwnerAppointment[]>([]);
  const [invitations, setInvitations] = useState<InvitationCode[]>([]);

  // Selection states (for no-inline-actions)
  const [selectedBarberManage, setSelectedBarberManage] = useState<BarberMember | null>(null);
  const [selectedAppointmentManage, setSelectedAppointmentManage] = useState<OwnerAppointment | null>(null);

  const [appointmentDate, setAppointmentDate] = useState(todayIsoDate());
  const [appointmentBarberId, setAppointmentBarberId] = useState('');
  const [newBarberEmail, setNewBarberEmail] = useState('');
  const [invitationExpiresAt, setInvitationExpiresAt] = useState(todayIsoDate());

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [savingBarbershop, setSavingBarbershop] = useState(false);
  const [addingBarber, setAddingBarber] = useState(false);
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Touch handling for barber rows (mobile long press)
  const touchTimerRef = useRef<any>(null);
  const handleBarberTouchStart = (barber: BarberMember) => {
    touchTimerRef.current = setTimeout(() => {
      setSelectedBarberManage(barber);
    }, 700);
  };
  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const activeBarbers = useMemo(
    () => barbers.filter((barber) => barber.status === 'active'),
    [barbers]
  );

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== 'confirmed' && appointment.status !== 'cancelled'),
    [appointments]
  );

  const activeInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.is_active),
    [invitations]
  );

  const avatarUrl = useMemo(() => {
    const displayName = profile?.full_name || profile?.name || localStorage.getItem('user_name') || 'Owner';
    return profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D4AF37&color=000&size=100`;
  }, [profile]);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    navigate('/');
  };

  const loadProfile = async () => {
    try {
      const currentProfile = await cachedRequest<UserProfile>('/users/me', 120000);
      setProfile(currentProfile);
    } catch {
      setProfile({
        full_name: localStorage.getItem('user_name') || 'Propietario',
        email: localStorage.getItem('user_email') || '',
        role: localStorage.getItem('user_role') || 'owner',
      });
    }
  };

  const loadBarbershop = async () => {
    const payload = await cachedRequest<Barbershop | ApiListResponse<Barbershop>>('/api/owner/barbershop', 300000);
    const shop = unwrapData<Barbershop>(payload, {});
    setBarbershop(shop);
    setBarbershopForm(mapBarbershopToForm(shop));
    return shop;
  };

  const loadBarbers = async () => {
    const payload = await cachedRequest<BarberMember[] | ApiListResponse<BarberMember[]>>('/api/owner/barbers', 180000);
    setBarbers(unwrapData<BarberMember[]>(payload, []));
    setSelectedBarberManage(null);
  };

  const loadAppointments = async (dateValue = appointmentDate, barberIdValue = appointmentBarberId) => {
    setLoadingAppointments(true);
    try {
      const params = new URLSearchParams();
      if (dateValue) params.set('date', dateValue);
      if (barberIdValue) params.set('barber_id', barberIdValue);
      const query = params.toString();
      const endpoint = query ? `/api/owner/appointments?${query}` : '/api/owner/appointments';
      const payload = await request<OwnerAppointment[] | ApiListResponse<OwnerAppointment[]>>("GET", endpoint);
      setAppointments(unwrapData<OwnerAppointment[]>(payload, []));
      setSelectedAppointmentManage(null);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadInvitations = async (shopId?: string) => {
    if (!shopId) {
      setInvitations([]);
      return;
    }
    try {
      const payload = await cachedRequest<InvitationCode[] | ApiListResponse<InvitationCode[]>>(`/barbershops/${shopId}/invitations`, 180000);
      setInvitations(unwrapData<InvitationCode[]>(payload, []));
    } catch {
      setInvitations([]);
    }
  };

  const reloadOwnerData = async () => {
    setError(null);
    setLoadingInitial(true);
    try {
      await loadProfile();
      const shop = await loadBarbershop();
      await Promise.all([
        loadBarbers(),
        loadAppointments(appointmentDate, appointmentBarberId),
        loadInvitations(shop.id),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar el módulo del propietario.';
      setError(message);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    reloadOwnerData();
  }, []);

  const handleSaveBarbershop = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingBarbershop(true);
    setError(null);
    try {
      const updated = await request<Barbershop | ApiListResponse<Barbershop>>('PUT', '/api/owner/barbershop', {
        name: barbershopForm.name,
        phone: barbershopForm.phone,
        email: barbershopForm.email,
        address: barbershopForm.address,
        description: barbershopForm.description,
        logo_url: barbershopForm.logo_url,
      });
      const updatedShop = unwrapData<Barbershop>(updated, barbershop || {});
      clearApiCache();
      setBarbershop(updatedShop);
      setBarbershopForm(mapBarbershopToForm(updatedShop));
      showSuccess('La información de la barbería fue actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la barbería.');
    } finally {
      setSavingBarbershop(false);
    }
  };

  const handleAddBarber = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newBarberEmail.trim()) return;
    setAddingBarber(true);
    setError(null);
    try {
      await request('POST', '/api/owner/barbers', { email: newBarberEmail.trim() });
      clearApiCache();
      setNewBarberEmail('');
      await loadBarbers();
      showSuccess('El barbero fue agregado al equipo correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar el barbero.');
    } finally {
      setAddingBarber(false);
    }
  };

  const handleToggleBarberStatus = async (barber: BarberMember) => {
    const currentMemberId = memberId(barber);
    if (!currentMemberId) return;
    const nextStatus: EntityStatus = barber.status === 'active' ? 'inactive' : 'active';
    setUpdatingMemberId(currentMemberId);
    setError(null);
    try {
      await request('PATCH', `/api/owner/barbers/${currentMemberId}/status`, { status: nextStatus });
      clearApiCache();
      await loadBarbers();
      showSuccess(`El barbero fue marcado como ${nextStatus === 'active' ? 'activo' : 'inactivo'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del barbero.');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleCreateInvitation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!barbershop?.id) {
      setError('No se pudo determinar la barbería del propietario.');
      return;
    }
    setCreatingInvitation(true);
    setError(null);
    try {
      await request('POST', `/barbershops/${barbershop.id}/invitations`, {
        expires_at: `${invitationExpiresAt}T23:59:59`,
      });
      clearApiCache();
      await loadInvitations(barbershop.id);
      showSuccess('Código de invitación generado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el código de invitación.');
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleAppointmentFilter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await loadAppointments(appointmentDate, appointmentBarberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda global.');
    }
  };

  const handleUpdateAppointmentStatus = async (targetAppointment: OwnerAppointment, status: 'confirmed' | 'cancelled') => {
    const currentAppointmentId = appointmentId(targetAppointment);
    if (!currentAppointmentId) return;
    setUpdatingAppointmentId(currentAppointmentId);
    setError(null);
    try {
      await request('PATCH', `/api/owner/appointments/${currentAppointmentId}/status`, { status });
      clearApiCache();
      await loadAppointments(appointmentDate, appointmentBarberId);
      showSuccess(`La cita fue ${status === 'confirmed' ? 'confirmada' : 'cancelada'} correctamente.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la cita.');
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const changeTab = (tab: OwnerTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-obsidian d-flex justify-content-center align-items-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-gold mb-3" size={44} />
          <p className="text-muted mb-0">Cargando módulo del propietario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-main)' }}>
      <button
        className="sidebar-toggle"
        aria-label="Abrir o cerrar menú lateral"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand-text">
          <i className="fa-solid fa-scissors"></i> SHARKHUB
        </div>

        <button className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => changeTab('overview')}>
          <i className="fa-solid fa-chart-pie"></i> Inicio
        </button>
        <button className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'barbershop' ? 'active' : ''}`} onClick={() => changeTab('barbershop')}>
          <i className="fa-solid fa-store"></i> Barbería
        </button>
        <button className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'barbers' ? 'active' : ''}`} onClick={() => changeTab('barbers')}>
          <i className="fa-solid fa-users"></i> Equipo
        </button>
        <button className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => changeTab('appointments')}>
          <i className="fa-regular fa-calendar-check"></i> Agenda global
        </button>
        <button className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'invitations' ? 'active' : ''}`} onClick={() => changeTab('invitations')}>
          <i className="fa-solid fa-ticket"></i> Invitaciones
        </button>

        <button className="nav-link logout-mt text-start bg-transparent border-0 w-100" onClick={handleLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
        </button>
      </nav>

      <main className="main-content">
        <header className="page-header">
          <div>
            <h2>Espacio del propietario</h2>
            <p className="text-muted mb-0 text-start">Administra la información, el equipo de barberos, las invitaciones y la agenda general.</p>
          </div>
          <div className="user-profile">
            <div className="text-end d-none d-sm-block">
              <h6 className="mb-0">{profile?.full_name || profile?.name || localStorage.getItem('user_name') || 'Propietario'}</h6>
              <small className="text-muted">Propietario</small>
            </div>
            <img src={avatarUrl} alt="Propietario" className="avatar" />
          </div>
        </header>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        {activeTab === 'overview' && (
          <section className="content-section active text-start">
            <div className="row g-4">
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-info"><h3>{appointments.length}</h3><p>Citas filtradas</p></div>
                  <div className="stat-icon"><CalendarDays size={30} /></div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-info"><h3>{activeBarbers.length}</h3><p>Barberos activos</p></div>
                  <div className="stat-icon"><Users size={30} /></div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-info"><h3>{pendingAppointments.length}</h3><p>Citas pendientes</p></div>
                  <div className="stat-icon"><Scissors size={30} /></div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card">
                  <div className="stat-info"><h3>{activeInvitations.length}</h3><p>Invitaciones activas</p></div>
                  <div className="stat-icon"><Ticket size={30} /></div>
                </div>
              </div>
            </div>

            <div className="panel-card mt-5">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
                <div>
                  <h4 className="section-title mb-1">Resumen de la barbería</h4>
                  <p className="text-muted mb-0">Datos principales cargados desde el perfil del propietario.</p>
                </div>
                <button className="btn btn-outline-gold btn-sm" onClick={reloadOwnerData}>
                  <RefreshCw size={16} className="me-2" /> Recargar
                </button>
              </div>
              <div className="row g-4">
                <div className="col-md-4">
                  <p className="text-muted mb-1">Nombre</p>
                  <h5 className="text-white">{barbershop?.name || 'Sin nombre configurado'}</h5>
                </div>
                <div className="col-md-4">
                  <p className="text-muted mb-1">Teléfono</p>
                  <h5 className="text-white">{barbershop?.phone || 'Sin teléfono'}</h5>
                </div>
                <div className="col-md-4">
                  <p className="text-muted mb-1">Correo</p>
                  <h5 className="text-white text-lowercase">{barbershop?.email || 'Sin correo'}</h5>
                </div>
                <div className="col-12">
                  <p className="text-muted mb-1">Dirección</p>
                  <p className="mb-0">{barbershop?.address || 'Sin dirección registrada'}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'barbershop' && (
          <section className="content-section active text-start">
            <h4 className="section-title">Editar información de la barbería</h4>
            <div className="panel-card dashboard-form">
              <form onSubmit={handleSaveBarbershop}>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label">Nombre de la barbería</label>
                    <input className="form-control" value={barbershopForm.name} onChange={(event) => setBarbershopForm({ ...barbershopForm, name: event.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Número de teléfono</label>
                    <input className="form-control" value={barbershopForm.phone} onChange={(event) => setBarbershopForm({ ...barbershopForm, phone: event.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Correo de la barbería</label>
                    <input type="email" className="form-control" value={barbershopForm.email} onChange={(event) => setBarbershopForm({ ...barbershopForm, email: event.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">URL del logo</label>
                    <input className="form-control" value={barbershopForm.logo_url} onChange={(event) => setBarbershopForm({ ...barbershopForm, logo_url: event.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Ubicación / Dirección</label>
                    <input className="form-control" value={barbershopForm.address} onChange={(event) => setBarbershopForm({ ...barbershopForm, address: event.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Descripción</label>
                    <textarea className="form-control" rows={4} value={barbershopForm.description} onChange={(event) => setBarbershopForm({ ...barbershopForm, description: event.target.value })}></textarea>
                  </div>
                  <div className="col-12 text-end mt-4">
                    <button type="submit" className="btn btn-gold" disabled={savingBarbershop}>
                      {savingBarbershop ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        )}

        {activeTab === 'barbers' && (
          <section className="content-section active text-start">
            <div className="section-title flex-wrap gap-3">
              <h4>Gestión de barberos</h4>
            </div>

            <div className="panel-card dashboard-form">
              <form className="row g-3 align-items-end" onSubmit={handleAddBarber}>
                <div className="col-md-8">
                  <label className="form-label">Correo del usuario registrado</label>
                  <input type="email" className="form-control" placeholder="barbero@correo.com" value={newBarberEmail} onChange={(event) => setNewBarberEmail(event.target.value)} required />
                  <small className="text-muted">El usuario debe existir previamente como cuenta registrada.</small>
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-gold w-100" disabled={addingBarber}>
                    {addingBarber ? 'Agregando...' : 'Agregar barbero'}
                  </button>
                </div>
              </form>
            </div>

            {/* Compliant Action Toolbar - No Inline Actions */}
            <div className="panel-card mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4" style={{ border: '1px solid var(--border-color)', backgroundColor: '#1c1c1a' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="fa-solid fa-circle-info text-gold fs-5"></i>
                {selectedBarberManage ? (
                  <div className="text-start">
                    <span className="text-white fw-bold">Seleccionado:</span> <span className="text-gold fw-bold">{barberName(selectedBarberManage)}</span>
                    <span className="text-muted ms-2">({selectedBarberManage.status === 'active' ? 'Activo' : 'Inactivo'})</span>
                  </div>
                ) : (
                  <span className="text-muted italic">Selecciona un barbero de la tabla para activar o desactivar su cuenta.</span>
                )}
              </div>
              <div className="d-flex gap-2">
                {selectedBarberManage && (
                  <button 
                    type="button"
                    onClick={() => handleToggleBarberStatus(selectedBarberManage)} 
                    className={`btn fw-bold px-3 py-2 ${selectedBarberManage.status === 'active' ? 'btn-outline-danger' : 'btn-outline-gold'}`}
                    disabled={updatingMemberId === memberId(selectedBarberManage)}
                  >
                    {updatingMemberId === memberId(selectedBarberManage) ? 'Actualizando...' : selectedBarberManage.status === 'active' ? 'Desactivar Barbero' : 'Activar Barbero'}
                  </button>
                )}
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-dashboard table-hover">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {barbers.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-muted">No hay barberos registrados.</td></tr>
                  ) : barbers.map((barber) => {
                    const currentMemberId = memberId(barber);
                    const name = barberName(barber);
                    const isActive = barber.status === 'active';
                    const isSelected = selectedBarberManage && memberId(selectedBarberManage) === currentMemberId;
                    return (
                      <tr 
                        key={currentMemberId || barber.user_id || name}
                        className={`align-middle cursor-pointer ${isSelected ? 'table-activeselected' : ''}`}
                        onClick={() => setSelectedBarberManage(barber)}
                        onTouchStart={() => handleBarberTouchStart(barber)}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        style={{ transition: 'background-color 0.2s' }}
                      >
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D4AF37&color=000`} alt={name} className="avatar-sm" />
                            <span className="text-white fw-bold">{name}</span>
                          </div>
                        </td>
                        <td className="text-muted">{barber.email || 'Sin correo'}</td>
                        <td className="text-muted">{barber.phone || 'Sin teléfono'}</td>
                        <td><span className={memberStatusClass(barber.status)}>{isActive ? 'Activo' : 'Inactivo'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'appointments' && (
          <section className="content-section active text-start">
            <div className="section-title flex-wrap gap-3">
              <h4>Agenda general de la sucursal</h4>
            </div>

            <div className="panel-card dashboard-form">
              <form className="row g-3 align-items-end" onSubmit={handleAppointmentFilter}>
                <div className="col-md-4">
                  <label className="form-label">Fecha</label>
                  <input type="date" className="form-control" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
                </div>
                <div className="col-md-5">
                  <label className="form-label">Barbero</label>
                  <select className="form-select" value={appointmentBarberId} onChange={(event) => setAppointmentBarberId(event.target.value)}>
                    <option value="">Todos los barberos</option>
                    {activeBarbers.map((barber) => (
                      <option key={barber.user_id || memberId(barber)} value={barber.user_id || barber.id || ''}>{barberName(barber)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <button type="submit" className="btn btn-gold w-100" disabled={loadingAppointments}>
                    {loadingAppointments ? 'Cargando...' : 'Filtrar'}
                  </button>
                </div>
              </form>
            </div>

            {/* Compliant Action Toolbar - No Inline Actions */}
            <div className="panel-card mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4" style={{ border: '1px solid var(--border-color)', backgroundColor: '#1c1c1a' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="fa-solid fa-circle-info text-gold fs-5"></i>
                {selectedAppointmentManage ? (
                  <div className="text-start">
                    <span className="text-white fw-bold">Seleccionado:</span> <span className="text-gold fw-bold">{appointmentClientName(selectedAppointmentManage)}</span>
                    <span className="text-muted ms-2">
                      ({formatDate(selectedAppointmentManage.appointment_date)} a las {formatTime(selectedAppointmentManage.start_time)} - {formatAppointmentStatus(selectedAppointmentManage.status)})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted italic">Selecciona una cita de la tabla para gestionarla (confirmar o cancelar).</span>
                )}
              </div>
              <div className="d-flex gap-2">
                {selectedAppointmentManage && (
                  <>
                    {selectedAppointmentManage.status !== 'confirmed' && selectedAppointmentManage.status !== 'cancelled' && (
                      <button 
                        type="button"
                        onClick={() => handleUpdateAppointmentStatus(selectedAppointmentManage, 'confirmed')} 
                        className="btn btn-outline-gold fw-bold px-3 py-2"
                        disabled={updatingAppointmentId === appointmentId(selectedAppointmentManage)}
                      >
                        Confirmar Cita
                      </button>
                    )}
                    {selectedAppointmentManage.status !== 'cancelled' && (
                      <button 
                        type="button"
                        onClick={() => handleUpdateAppointmentStatus(selectedAppointmentManage, 'cancelled')} 
                        className="btn btn-outline-danger fw-bold px-3 py-2"
                        disabled={updatingAppointmentId === appointmentId(selectedAppointmentManage)}
                      >
                        Cancelar Cita
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="panel-card mt-3">
              <div className="table-responsive">
                <table className="table table-dashboard table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>Barbero</th>
                      <th>Servicio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted">No hay citas para los filtros seleccionados.</td></tr>
                    ) : appointments.map((appointment) => {
                      const currentAppointmentId = appointmentId(appointment);
                      const isSelected = selectedAppointmentManage && appointmentId(selectedAppointmentManage) === currentAppointmentId;
                      return (
                        <tr 
                          key={currentAppointmentId}
                          className={`align-middle cursor-pointer ${isSelected ? 'table-activeselected' : ''}`}
                          onClick={() => setSelectedAppointmentManage(appointment)}
                          style={{ transition: 'background-color 0.2s' }}
                        >
                          <td className="text-white">{formatDate(appointment.appointment_date)}</td>
                          <td className="text-muted">{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</td>
                          <td className="text-white fw-bold">{appointmentClientName(appointment)}</td>
                          <td className="text-muted">{appointmentBarberName(appointment, barbers)}</td>
                          <td className="text-white">{appointmentServiceName(appointment)}</td>
                          <td><span className={appointmentStatusClass(appointment.status)}>{formatAppointmentStatus(appointment.status)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'invitations' && (
          <section className="content-section active text-start">
            <div className="section-title flex-wrap gap-3">
              <h4>Códigos de invitación</h4>
            </div>

            <div className="panel-card dashboard-form">
              <form className="row g-3 align-items-end" onSubmit={handleCreateInvitation}>
                <div className="col-md-8">
                  <label className="form-label">Fecha de expiración</label>
                  <input type="date" className="form-control" value={invitationExpiresAt} onChange={(event) => setInvitationExpiresAt(event.target.value)} required />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-gold w-100" disabled={creatingInvitation || !barbershop?.id}>
                    {creatingInvitation ? 'Generando...' : 'Generar código'}
                  </button>
                </div>
              </form>
            </div>

            <div className="table-responsive">
              <table className="table table-dashboard table-hover">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Expira</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-muted">Todavía no hay códigos de invitación registrados.</td></tr>
                  ) : invitations.map((invitation) => (
                    <tr key={invitation.invitation_id || invitation.id || invitation.code}>
                      <td><strong className="text-gold">{invitation.code || 'Sin código'}</strong></td>
                      <td>{invitation.expires_at ? new Date(invitation.expires_at).toLocaleString('es-EC') : 'Sin expiración'}</td>
                      <td><span className={invitation.is_active ? 'status-badge status-confirmed' : 'status-badge status-cancelled'}>{invitation.is_active ? 'Activo' : 'Inactivo'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
