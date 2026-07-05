/* ==========================================================================
   SharkHub Owner Dashboard — barbershop, barbers and global agenda.
   ========================================================================== */

'use strict'

const ownerState = {
    user: null,
    barbershop: null,
    barbers: [],
    appointments: [],
}

async function ownerApiFetch(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error al comunicarse con el servidor.')
    }

    return data
}

function ownerEscapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

function ownerFormatMoney(value) {
    return '$' + Number(value || 0).toFixed(2)
}

function ownerFormatTime(value) {
    if (!value) return ''

    const [hourValue, minuteValue] = String(value).split(':')
    const hour = Number(hourValue)
    const minute = minuteValue || '00'
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12

    return `${formattedHour}:${minute} ${suffix}`
}

function ownerFormatStatus(status) {
    if (status === 'confirmed') {
        return '<span class="status-badge status-confirmed">Confirmado</span>'
    }

    if (status === 'cancelled') {
        return '<span class="status-badge status-cancelled">Cancelado</span>'
    }

    return '<span class="status-badge status-pending">Pendiente</span>'
}

function ownerGetModalInstance(modalId) {
    const modalElement = document.getElementById(modalId)

    if (!modalElement) {
        return null
    }

    return bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement)
}

function ownerGetAgendaFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search)

    return {
        date: params.get('date') || '',
        barberId: params.get('barber_id') || '',
    }
}

function ownerUpdateAgendaUrl(dateValue = '', barberId = '') {
    const params = new URLSearchParams()

    if (dateValue) {
        params.set('date', dateValue)
    }

    if (barberId) {
        params.set('barber_id', barberId)
    }

    const baseUrl = '/owner/dashboard/global-agenda'
    const nextUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
    const currentUrl = window.location.pathname + window.location.search

    if (currentUrl !== nextUrl) {
        window.history.pushState({ tabId: 'global-agenda', date: dateValue, barberId: barberId }, '', nextUrl)
    }
}

function ownerBuildAppointmentsEndpoint(dateValue = '', barberId = '') {
    const params = new URLSearchParams()

    if (dateValue) {
        params.set('date', dateValue)
    }

    if (barberId) {
        params.set('barber_id', barberId)
    }

    const query = params.toString()

    return query ? `/api/owner/appointments?${query}` : '/api/owner/appointments'
}

async function ownerLoadMe() {
    const result = await ownerApiFetch('/api/me')
    ownerState.user = result.user

    if (ownerState.user?.role !== 'owner') {
        throw new Error('La sesión actual no pertenece a un propietario activo.')
    }

    const name = ownerState.user?.name || 'Propietario'
    const profileName = document.getElementById('ownerProfileName')
    const profileRole = document.getElementById('ownerProfileRole')
    const profileAvatar = document.getElementById('ownerProfileAvatar')

    if (profileName) profileName.textContent = name
    if (profileRole) profileRole.textContent = 'Propietario'
    if (profileAvatar) {
        profileAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=D4AF37&color=000'
        profileAvatar.alt = name
    }
}

async function ownerLoadOverview() {
    const result = await ownerApiFetch('/api/owner/overview')
    const data = result.data || {}

    const totalAppointments = document.getElementById('ownerTotalAppointments')
    const activeBarbers = document.getElementById('ownerActiveBarbers')
    const monthlyRevenue = document.getElementById('ownerMonthlyRevenue')

    if (totalAppointments) totalAppointments.textContent = data.total_appointments ?? 0
    if (activeBarbers) activeBarbers.textContent = data.active_barbers ?? 0
    if (monthlyRevenue) monthlyRevenue.textContent = ownerFormatMoney(data.monthly_revenue ?? 0)

    ownerRenderRecentActivity(data.recent_appointments || [])
}

function ownerRenderRecentActivity(appointments) {
    const tbody = document.getElementById('ownerRecentActivityTableBody')

    if (!tbody) return

    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay actividad reciente.</td></tr>'
        return
    }

    tbody.innerHTML = appointments.map((appointment) => {
        const clientName = appointment.client?.full_name || 'Cliente'
        const barberName = appointment.barber?.full_name || 'Barbero'
        const serviceName = appointment.services?.map((service) => service.name).join(', ') || 'Servicio'
        const dateTime = `${appointment.appointment_date || ''} ${ownerFormatTime(appointment.start_time)}`

        return `
            <tr>
                <td>${ownerEscapeHtml(clientName)}</td>
                <td>${ownerEscapeHtml(barberName)}</td>
                <td>${ownerEscapeHtml(serviceName)}</td>
                <td>${ownerEscapeHtml(dateTime)}</td>
                <td>${ownerFormatStatus(appointment.status)}</td>
            </tr>
        `
    }).join('')
}

async function ownerLoadBarbershop() {
    const result = await ownerApiFetch('/api/owner/barbershop')
    const barbershop = result.data || {}
    ownerState.barbershop = barbershop

    const fields = {
        ownerBarbershopName: barbershop.name || '',
        ownerBarbershopPhone: barbershop.phone || '',
        ownerBarbershopEmail: barbershop.email || '',
        ownerBarbershopLogoUrl: barbershop.logo_url || '',
        ownerBarbershopAddress: barbershop.address || '',
        ownerBarbershopDescription: barbershop.description || '',
    }

    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id)
        if (input) input.value = value
    })
}

async function ownerSaveBarbershop() {
    const button = document.getElementById('saveBarbershopBtn')
    const originalText = button?.innerHTML

    const data = {
        name: document.getElementById('ownerBarbershopName')?.value || '',
        phone: document.getElementById('ownerBarbershopPhone')?.value || '',
        email: document.getElementById('ownerBarbershopEmail')?.value || '',
        logo_url: document.getElementById('ownerBarbershopLogoUrl')?.value || '',
        address: document.getElementById('ownerBarbershopAddress')?.value || '',
        description: document.getElementById('ownerBarbershopDescription')?.value || '',
    }

    try {
        if (button) {
            button.disabled = true
            button.innerHTML = 'Guardando...'
        }

        await ownerApiFetch('/api/owner/barbershop', {
            method: 'PUT',
            body: JSON.stringify(data),
        })

        alert('Información de la barbería actualizada correctamente.')
        await ownerLoadBarbershop()
    } finally {
        if (button) {
            button.disabled = false
            button.innerHTML = originalText
        }
    }
}

async function ownerLoadBarbers() {
    const result = await ownerApiFetch('/api/owner/barbers')
    ownerState.barbers = result.data || []

    ownerRenderBarbersTable()
    ownerRenderBarberFilter()
}

function ownerRenderBarbersTable() {
    const tbody = document.getElementById('ownerBarbersTableBody')

    if (!tbody) return

    if (ownerState.barbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay barberos registrados.</td></tr>'
        return
    }

    tbody.innerHTML = ownerState.barbers.map((barber) => {
        const isActive = barber.status === 'active'
        const nextStatus = isActive ? 'inactive' : 'active'
        const buttonText = isActive ? 'Desactivar' : 'Activar'
        const buttonClass = isActive ? 'btn-outline-danger' : 'btn-outline-gold'
        const name = barber.full_name || 'Barbero'

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D4AF37&color=000" alt="${ownerEscapeHtml(name)}" class="rounded-circle" width="30">
                        ${ownerEscapeHtml(name)}
                    </div>
                </td>
                <td>${ownerEscapeHtml(barber.email || '')}</td>
                <td>${ownerEscapeHtml(barber.phone || '')}</td>
                <td>${isActive ? '<span class="status-badge status-confirmed">Activo</span>' : '<span class="status-badge status-cancelled">Inactivo</span>'}</td>
                <td>
                    <button type="button" class="btn ${buttonClass} btn-sm" onclick="ownerUpdateBarberStatus('${ownerEscapeHtml(barber.membership_id)}', '${nextStatus}')">
                        ${buttonText}
                    </button>
                </td>
            </tr>
        `
    }).join('')
}

function ownerRenderBarberFilter() {
    const select = document.getElementById('ownerAgendaBarberFilter')

    if (!select) return

    const currentValue = select.value

    select.innerHTML = '<option value="">Todos los barberos</option>'
    ownerState.barbers
        .filter((barber) => barber.status === 'active')
        .forEach((barber) => {
            const option = document.createElement('option')
            option.value = barber.user_id
            option.textContent = barber.full_name || barber.email || 'Barbero'
            select.appendChild(option)
        })

    const filters = ownerGetAgendaFiltersFromUrl()
    select.value = filters.barberId || currentValue || ''
}

async function ownerAddBarber() {
    const emailInput = document.getElementById('newBarberEmail')
    const button = document.getElementById('saveNewBarberBtn')
    const originalText = button?.innerHTML
    const email = emailInput?.value || ''

    try {
        if (button) {
            button.disabled = true
            button.innerHTML = 'Agregando...'
        }

        await ownerApiFetch('/api/owner/barbers', {
            method: 'POST',
            body: JSON.stringify({ email: email }),
        })

        const modal = ownerGetModalInstance('addBarberModal')
        if (modal) modal.hide()

        if (emailInput) emailInput.value = ''

        await ownerLoadBarbers()
        await ownerLoadOverview()
        alert('Barbero agregado correctamente.')
    } finally {
        if (button) {
            button.disabled = false
            button.innerHTML = originalText
        }
    }
}

async function ownerUpdateBarberStatus(membershipId, status) {
    const actionText = status === 'active' ? 'activar' : 'desactivar'

    if (!confirm(`¿Deseas ${actionText} este barbero?`)) {
        return
    }

    try {
        await ownerApiFetch(`/api/owner/barbers/${encodeURIComponent(membershipId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: status }),
        })

        await ownerLoadBarbers()
        await ownerLoadOverview()
        await ownerLoadAppointmentsFromFilters(false)
    } catch (error) {
        alert(error.message)
    }
}

async function ownerLoadAppointmentsFromFilters(updateUrl = true) {
    const dateInput = document.getElementById('ownerAgendaDateFilter')
    const barberSelect = document.getElementById('ownerAgendaBarberFilter')
    const dateValue = dateInput?.value || ''
    const barberId = barberSelect?.value || ''

    if (updateUrl) {
        ownerUpdateAgendaUrl(dateValue, barberId)
    }

    await ownerLoadAppointments(dateValue, barberId)
}

async function ownerLoadAppointments(dateValue = '', barberId = '') {
    const tbody = document.getElementById('ownerAppointmentsTableBody')

    if (!tbody) return

    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Cargando agenda...</td></tr>'

    try {
        const endpoint = ownerBuildAppointmentsEndpoint(dateValue, barberId)
        const result = await ownerApiFetch(endpoint)
        ownerState.appointments = result.data || []

        if (ownerState.appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay citas para mostrar.</td></tr>'
            return
        }

        tbody.innerHTML = ownerState.appointments.map((appointment) => {
            const clientName = appointment.client?.full_name || 'Cliente'
            const barberName = appointment.barber?.full_name || 'Barbero'
            const serviceName = appointment.services?.map((service) => service.name).join(', ') || 'Servicio'
            const canConfirm = appointment.status === 'pending'
            const canCancel = appointment.status !== 'cancelled'

            return `
                <tr>
                    <td>${ownerEscapeHtml(ownerFormatTime(appointment.start_time))}</td>
                    <td>${ownerEscapeHtml(clientName)}</td>
                    <td>${ownerEscapeHtml(barberName)}</td>
                    <td>${ownerEscapeHtml(serviceName)}</td>
                    <td>${ownerFormatStatus(appointment.status)}</td>
                    <td>
                        ${canConfirm ? `<button type="button" class="btn btn-outline-gold btn-sm me-2" onclick="ownerUpdateAppointmentStatus('${ownerEscapeHtml(appointment.id)}', 'confirmed')">Confirmar</button>` : ''}
                        ${canCancel ? `<button type="button" class="btn btn-outline-danger btn-sm" onclick="ownerUpdateAppointmentStatus('${ownerEscapeHtml(appointment.id)}', 'cancelled')">Cancelar</button>` : ''}
                    </td>
                </tr>
            `
        }).join('')
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${ownerEscapeHtml(error.message)}</td></tr>`
    }
}

async function ownerUpdateAppointmentStatus(appointmentId, status) {
    const actionText = status === 'confirmed' ? 'confirmar' : 'cancelar'

    if (!confirm(`¿Deseas ${actionText} esta cita?`)) {
        return
    }

    try {
        await ownerApiFetch(`/api/owner/appointments/${encodeURIComponent(appointmentId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: status }),
        })

        await ownerLoadAppointmentsFromFilters(false)
        await ownerLoadOverview()
    } catch (error) {
        alert(error.message)
    }
}

function ownerConfigureEvents() {
    const barbershopForm = document.getElementById('ownerBarbershopForm')
    if (barbershopForm) {
        barbershopForm.addEventListener('submit', async function (event) {
            event.preventDefault()

            try {
                await ownerSaveBarbershop()
            } catch (error) {
                alert(error.message)
            }
        })
    }

    const openAddBarberModalBtn = document.getElementById('openAddBarberModalBtn')
    if (openAddBarberModalBtn) {
        openAddBarberModalBtn.addEventListener('click', function () {
            const modal = ownerGetModalInstance('addBarberModal')
            if (modal) modal.show()
        })
    }

    const addBarberForm = document.getElementById('addBarberForm')
    if (addBarberForm) {
        addBarberForm.addEventListener('submit', async function (event) {
            event.preventDefault()

            try {
                await ownerAddBarber()
            } catch (error) {
                alert(error.message)
            }
        })
    }

    const dateInput = document.getElementById('ownerAgendaDateFilter')
    const barberSelect = document.getElementById('ownerAgendaBarberFilter')
    const filters = ownerGetAgendaFiltersFromUrl()

    if (dateInput) {
        dateInput.value = filters.date || ''
        dateInput.addEventListener('change', function () {
            ownerLoadAppointmentsFromFilters(true)
        })
    }

    if (barberSelect) {
        barberSelect.addEventListener('change', function () {
            ownerLoadAppointmentsFromFilters(true)
        })
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    ownerConfigureEvents()

    try {
        await ownerLoadMe()
        await Promise.all([
            ownerLoadOverview(),
            ownerLoadBarbershop(),
            ownerLoadBarbers(),
        ])

        const filters = ownerGetAgendaFiltersFromUrl()
        await ownerLoadAppointments(filters.date, filters.barberId)
    } catch (error) {
        console.error(error)
        alert(error.message)
        window.location.href = '/'
    }
})

window.ownerUpdateBarberStatus = ownerUpdateBarberStatus
window.ownerUpdateAppointmentStatus = ownerUpdateAppointmentStatus
