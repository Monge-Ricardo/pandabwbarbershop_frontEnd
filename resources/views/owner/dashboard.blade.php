<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Panel administrativo | SharkHub</title>
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="/css/dashboard.css" rel="stylesheet">
</head>
<body>

{{-- Datos de sesión inyectados desde PHP — no dependen de fetch --}}
<script>
window.OWNER = {
    userId:       "{{ $sessionUserId }}",
    name:         "{{ $sessionUserName }}",
    email:        "{{ $sessionUserEmail }}",
    barbershopId: "{{ $sessionBarbershopId }}"
};
</script>

<button class="sidebar-toggle" aria-label="Toggle sidebar"><i class="fa-solid fa-bars"></i></button>

<nav class="sidebar">
    <div class="brand-text"><i class="fa-solid fa-scissors"></i> SHARKHUB</div>
    <a href="#" class="nav-link active" onclick="switchTab('dashboard')"><i class="fa-solid fa-chart-pie"></i>Inicio</a>
    <a href="#" class="nav-link" onclick="switchTab('barbershop-info')"><i class="fa-solid fa-store"></i>Información de la barbería</a>
    <a href="#" class="nav-link" onclick="switchTab('manage-barbers')"><i class="fa-solid fa-users"></i>Gestión de barberos</a>
    <a href="#" class="nav-link" onclick="switchTab('global-agenda')"><i class="fa-regular fa-calendar-check"></i>Agenda general</a>
    <a href="#" class="nav-link logout-mt" id="logoutBtn"><i class="fa-solid fa-arrow-right-from-bracket"></i>Cerrar sesión</a>
</nav>

<main class="main-content">
    <header class="page-header">
        <div>
            <h2>Espacio del propietario</h2>
            <p class="text-muted mb-0">Administra la información, el personal y la agenda de la barbería.</p>
        </div>
        <div class="user-profile">
            <div class="text-end d-none d-sm-block">
                <h6 class="mb-0" id="ownerName"></h6>
                <small class="text-muted">Propietario</small>
            </div>
            <img src="" alt="Owner" class="avatar" id="ownerAvatar">
        </div>
    </header>

    <div id="globalError" class="alert alert-danger d-none mx-3 mt-3"></div>

    {{-- Tab: Resumen --}}
    <section id="dashboard" class="content-section active">
        <div class="row g-4">
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="stat-info"><h3 id="statTotal">—</h3><p>Total de citas</p></div>
                    <div class="stat-icon"><i class="fa-regular fa-calendar"></i></div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="stat-info"><h3 id="statBarbers">—</h3><p>Barberos activos</p></div>
                    <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <div class="stat-info"><h3 id="statPending">—</h3><p>Citas pendientes</p></div>
                    <div class="stat-icon"><i class="fa-solid fa-clock"></i></div>
                </div>
            </div>
        </div>
        <div class="mt-5">
            <h4 class="section-title">Actividad reciente</h4>
            <div class="table-responsive">
                <table class="table table-dashboard table-hover">
                    <thead><tr><th>Cliente</th><th>Barbero</th><th>Fecha/Hora</th><th>Estado</th></tr></thead>
                    <tbody id="recentAppointmentsBody">
                        <tr><td colspan="4" class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    {{-- Tab: Info Barbería --}}
    <section id="barbershop-info" class="content-section">
        <h4 class="section-title">Editar información de la barbería</h4>
        <div class="panel-card dashboard-form">
            <form id="barbershopForm">
                <div class="row g-4">
                    <div class="col-md-6">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-control" id="bsName" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Teléfono</label>
                        <input type="text" class="form-control" id="bsPhone">
                    </div>
                    <div class="col-12">
                        <label class="form-label">Dirección</label>
                        <input type="text" class="form-control" id="bsAddress">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Email de contacto</label>
                        <input type="email" class="form-control" id="bsEmail">
                    </div>
                    <div class="col-12">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-control" rows="4" id="bsDescription"></textarea>
                    </div>
                    <div class="col-12 text-end mt-4">
                        <span id="bsSaveOk" class="me-3 text-success d-none">¡Guardado!</span>
                        <span id="bsSaveErr" class="me-3 text-danger d-none"></span>
                        <button type="submit" class="btn btn-gold">Guardar Cambios</button>
                    </div>
                </div>
            </form>
        </div>
    </section>

    {{-- Tab: Gestión de barberos --}}
    <section id="manage-barbers" class="content-section">
        <div class="section-title">
            <h4>Gestión de barberos</h4>
        </div>
        <div class="section-actions">
            <button class="btn btn-outline-gold btn-sm dashboard-action-btn" data-bs-toggle="modal" data-bs-target="#addBarberModal">
                <i class="fa-solid fa-user-plus"></i> Agregar barbero
            </button>
        </div>
        <div class="table-responsive">
            <table class="table table-dashboard table-hover">
                <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody id="barbersTableBody">
                    <tr><td colspan="5" class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    </section>

    {{-- Tab: Agenda --}}
    <section id="global-agenda" class="content-section">
        <div class="section-title">
            <h4>Agenda General</h4>
            <input type="date" class="form-control form-control-sm" id="agendaDateFilter" style="width:auto;">
        </div>
        <div class="table-responsive">
            <table class="table table-dashboard table-hover mt-3">
                <thead><tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Barbero</th><th>Estado</th></tr></thead>
                <tbody id="agendaTableBody">
                    <tr><td colspan="5" class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    </section>
</main>

{{-- Modal: Agregar barbero --}}
<div class="modal fade" id="addBarberModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content bg-dark text-white border-gold">
            <div class="modal-header border-secondary">
                <h5 class="modal-title">Agregar barbero por email</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label">Email del usuario registrado en SharkHub</label>
                    <div class="input-group">
                        <input type="email" class="form-control bg-dark text-white border-secondary"
                               id="searchBarberEmail" placeholder="usuario@email.com">
                        <button class="btn btn-outline-gold" type="button" id="searchBarberBtn">
                            <i class="fa-solid fa-magnifying-glass"></i> Buscar
                        </button>
                    </div>
                    <div id="searchBarberError" class="text-danger small mt-1 d-none"></div>
                </div>
                <div id="searchBarberResult" class="d-none">
                    <div class="p-3 mb-3 rounded" style="background:rgba(212,175,55,.12); border:1px solid #D4AF37;">
                        <p class="mb-1 fw-bold" id="foundBarberName"></p>
                        <p class="mb-0 text-muted small" id="foundBarberEmail"></p>
                        <input type="hidden" id="foundBarberId">
                    </div>
                    <div>
                        <label class="form-label">Rol</label>
                        <select class="form-select bg-dark text-white border-secondary" id="barberRoleSelect">
                            <option value="barber">Barbero</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-secondary">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-gold" id="confirmAddBarberBtn" disabled>
                    <i class="fa-solid fa-user-plus me-1"></i> Agregar
                </button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/js/dashboard-common.js"></script>
<script>
/* ============================================================
   OWNER DASHBOARD — Datos dinámicos desde la API
   Los datos del usuario vienen de window.OWNER (inyectado por Blade)
   Las peticiones a la API usan las rutas web (/owner/data/) que
   tienen acceso completo a la sesión PHP.
============================================================ */

const CSRF = document.querySelector('meta[name="csrf-token"]').content;
const BS_ID = window.OWNER.barbershopId;

// Mostrar nombre del owner inmediatamente (desde Blade, sin fetch)
document.getElementById('ownerName').textContent = window.OWNER.name || 'Propietario';
document.getElementById('ownerAvatar').src =
    'https://ui-avatars.com/api/?name=' + encodeURIComponent(window.OWNER.name || 'Owner') + '&background=D4AF37&color=000';

// ─── Helper de fetch — usa rutas web del owner ────────────────
async function ownerFetch(path, options = {}) {
    const url = '/owner/data' + path;
    const res = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Accept':       'application/json',
            'X-CSRF-TOKEN': CSRF,
            ...(options.headers || {}),
        },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || 'HTTP ' + res.status);
    return json;
}

function statusClass(s) {
    return {PENDING:'status-pending', ACCEPTED:'status-confirmed',
            CANCELLED:'status-cancelled', COMPLETED:'status-confirmed'}[s] || 'status-pending';
}

// ─── Init ────────────────────────────────────────────────────
async function init() {
    if (!BS_ID) {
        document.getElementById('globalError').textContent =
            'No tienes una barbería asociada. Contacta al administrador.';
        document.getElementById('globalError').classList.remove('d-none');
        return;
    }
    await loadBarbershopInfo();
    await Promise.all([loadBarbers(), loadAppointments()]);
}

// ─── Info de la barbería (HU9) ────────────────────────────────
async function loadBarbershopInfo() {
    try {
        const res = await ownerFetch('/barbershop');
        const bs  = res.data;
        document.getElementById('bsName').value        = bs.name        || '';
        document.getElementById('bsPhone').value       = bs.phone       || '';
        document.getElementById('bsAddress').value     = bs.address     || '';
        document.getElementById('bsEmail').value       = bs.email       || '';
        document.getElementById('bsDescription').value = bs.description || '';
    } catch (err) {
        document.getElementById('bsSaveErr').textContent = 'Error al cargar info: ' + err.message;
        document.getElementById('bsSaveErr').classList.remove('d-none');
    }
}

document.getElementById('barbershopForm').addEventListener('submit', async e => {
    e.preventDefault();
    document.getElementById('bsSaveOk').classList.add('d-none');
    document.getElementById('bsSaveErr').classList.add('d-none');
    try {
        await ownerFetch('/barbershop', {
            method: 'PUT',
            body: JSON.stringify({
                name:        document.getElementById('bsName').value,
                phone:       document.getElementById('bsPhone').value,
                address:     document.getElementById('bsAddress').value,
                email:       document.getElementById('bsEmail').value,
                description: document.getElementById('bsDescription').value,
            }),
        });
        document.getElementById('bsSaveOk').classList.remove('d-none');
        setTimeout(() => document.getElementById('bsSaveOk').classList.add('d-none'), 3000);
    } catch (err) {
        document.getElementById('bsSaveErr').textContent = 'Error: ' + err.message;
        document.getElementById('bsSaveErr').classList.remove('d-none');
    }
});

// ─── Barberos (HU10) ──────────────────────────────────────────
async function loadBarbers() {
    const tbody = document.getElementById('barbersTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando...</td></tr>';
    try {
        const res     = await ownerFetch('/members');
        const members = res.data;
        document.getElementById('statBarbers').textContent = members.length;
        if (!members.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay barberos registrados.</td></tr>';
            return;
        }
        tbody.innerHTML = members.map(m => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-container">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}&background=random&color=fff"
                                 class="avatar-sm" alt="">
                        </div>
                        <div>
                            <div class="fw-bold text-white">${m.full_name}</div>
                            <div class="text-muted small">ID: ${m.member_id.substring(0,8)}</div>
                        </div>
                    </div>
                </td>
                <td><i class="fa-regular fa-envelope me-2 text-gold"></i>${m.email}</td>
                <td><span class="badge-role">${m.role}</span></td>
                <td>
                    <span class="status-badge ${m.status === 'active' ? 'status-confirmed' : 'status-cancelled'}">
                        <i class="fa-solid ${m.status === 'active' ? 'fa-check-circle' : 'fa-circle-xmark'} me-1"></i>
                        ${m.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn-action edit" title="Ver detalles">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-action delete" title="Eliminar de la barbería"
                                onclick="removeBarber('${m.member_id}', '${m.full_name}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">Error: ${err.message}</td></tr>`;
    }
}

async function removeBarber(memberId, name) {
    if (!confirm('¿Remover a ' + name + ' de la barbería?')) return;
    try {
        await ownerFetch('/members/' + memberId, { method: 'DELETE' });
        await loadBarbers();
    } catch (err) { alert('Error: ' + err.message); }
}

// ─── Buscar usuario para agregar (HU11) ───────────────────────
document.getElementById('searchBarberBtn').addEventListener('click', async () => {
    const email = document.getElementById('searchBarberEmail').value.trim();
    const resEl = document.getElementById('searchBarberResult');
    const errEl = document.getElementById('searchBarberError');
    const addBtn = document.getElementById('confirmAddBarberBtn');
    resEl.classList.add('d-none'); errEl.classList.add('d-none'); addBtn.disabled = true;
    if (!email) return;
    try {
        const res = await ownerFetch('/search-user?email=' + encodeURIComponent(email));
        document.getElementById('foundBarberName').textContent  = res.data.full_name;
        document.getElementById('foundBarberEmail').textContent = res.data.email;
        document.getElementById('foundBarberId').value          = res.data.id;
        resEl.classList.remove('d-none');
        addBtn.disabled = false;
    } catch (err) {
        errEl.textContent = 'Usuario no encontrado. Debe estar registrado en SharkHub.';
        errEl.classList.remove('d-none');
    }
});

document.getElementById('searchBarberEmail').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('searchBarberBtn').click(); }
});

document.getElementById('confirmAddBarberBtn').addEventListener('click', async () => {
    const userId = document.getElementById('foundBarberId').value;
    const role   = document.getElementById('barberRoleSelect').value;
    const btn    = document.getElementById('confirmAddBarberBtn');
    btn.disabled = true;
    try {
        await ownerFetch('/members', { method: 'POST', body: JSON.stringify({ user_id: userId, role }) });
        bootstrap.Modal.getInstance(document.getElementById('addBarberModal')).hide();
        document.getElementById('searchBarberEmail').value = '';
        document.getElementById('searchBarberResult').classList.add('d-none');
        document.getElementById('searchBarberError').classList.add('d-none');
        await loadBarbers();
    } catch (err) { alert('Error al agregar: ' + err.message); }
    finally { btn.disabled = false; }
});

// ─── Citas / Agenda (HU24) ────────────────────────────────────
async function loadAppointments() {
    const tbody  = document.getElementById('agendaTableBody');
    const recent = document.getElementById('recentAppointmentsBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando...</td></tr>';
    try {
        const res  = await ownerFetch('/appointments');
        const apts = res.data || [];
        document.getElementById('statTotal').textContent   = apts.length;
        document.getElementById('statPending').textContent = apts.filter(a => a.status === 'PENDING').length;
        if (!apts.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Sin citas registradas.</td></tr>';
            recent.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Sin actividad reciente.</td></tr>';
            return;
        }
        tbody.innerHTML = apts.map(a => `
            <tr>
                <td>${a.appointment_date}</td>
                <td>${a.start_time}</td>
                <td>${a.client?.full_name || '—'}</td>
                <td>${a.barber?.full_name || '—'}</td>
                <td><span class="status-badge ${statusClass(a.status)}">${a.status}</span></td>
            </tr>`).join('');
        recent.innerHTML = apts.slice(0, 5).map(a => `
            <tr>
                <td>${a.client?.full_name || '—'}</td>
                <td>${a.barber?.full_name || '—'}</td>
                <td>${a.appointment_date} ${a.start_time}</td>
                <td><span class="status-badge ${statusClass(a.status)}">${a.status}</span></td>
            </tr>`).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-danger text-center py-3">Error: ${err.message}</td></tr>`;
    }
}

// ─── Logout ───────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async e => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin',
        headers: { 'X-CSRF-TOKEN': CSRF, 'Accept': 'application/json' } }).catch(() => {});
    sessionStorage.removeItem('sharkhub_session');
    window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', init);
</script>
</body>
</html>
