/* ==========================================================================
   SharkHub Dashboard — Customer real booking flow
   Loads barbers/services from API and saves appointments in PostgreSQL.
   ========================================================================== */

'use strict'

const state = {
    user: null,
    barbers: [],
    services: [],
    appointments: [],
    selectedBarber: null,
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
}

async function apiFetch(url, options = {}) {
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

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

function formatMoney(value) {
    return '$' + Number(value || 0).toFixed(2)
}

function formatDateLabel(dateValue) {
    const date = new Date(dateValue + 'T00:00:00')
    return date.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

function formatMonth(dateValue) {
    const date = new Date(dateValue + 'T00:00:00')
    return date.toLocaleDateString('es-EC', { month: 'long' })
}

function formatDay(dateValue) {
    const date = new Date(dateValue + 'T00:00:00')
    return date.toLocaleDateString('es-EC', { day: '2-digit' })
}

function formatStatus(status) {
    if (status === 'confirmed') {
        return '<span class="badge bg-success" style="padding: 8px 15px; font-size: 0.85rem;">Confirmado</span>'
    }

    if (status === 'cancelled') {
        return '<span class="badge bg-danger" style="padding: 8px 15px; font-size: 0.85rem;">Cancelado</span>'
    }

    return '<span class="badge bg-warning text-dark" style="padding: 8px 15px; font-size: 0.85rem;">Pendiente</span>'
}

function getCustomerName(user) {
    return user?.name || user?.full_name || 'Cliente'
}

function splitFullName(fullName) {
    const parts = String(fullName || '')
        .trim()
        .split(/\s+/)
        .filter((part) => part.length > 0)

    return {
        firstName: parts.length > 0 ? parts[0] : '',
        lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
    }
}

function updateCustomerHeader(user) {
    const name = getCustomerName(user)
    const profileName = document.querySelector('.user-profile span')
    const avatar = document.querySelector('.user-profile img')

    if (profileName) {
        profileName.textContent = name
    }

    if (avatar) {
        avatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=222&color=D4AF37'
        avatar.alt = name
    }
}

function updateCustomerProfile(user) {
    const name = getCustomerName(user)
    const { firstName, lastName } = splitFullName(name)

    const firstNameInput = document.getElementById('profileFirstName')
    const lastNameInput = document.getElementById('profileLastName')
    const emailInput = document.getElementById('profileEmail')
    const phoneInput = document.getElementById('profilePhone')

    if (firstNameInput) {
        firstNameInput.value = firstName
    }

    if (lastNameInput) {
        lastNameInput.value = lastName
    }

    if (emailInput) {
        emailInput.value = user?.email || ''
    }

    if (phoneInput) {
        phoneInput.value = user?.phone || ''
    }
}

async function loadMe() {
    try {
        const result = await apiFetch('/api/me')
        state.user = result.user || null

        if (!state.user) {
            throw new Error('No se encontró información del usuario autenticado.')
        }

        updateCustomerHeader(state.user)
        updateCustomerProfile(state.user)
    } catch (error) {
        window.location.href = '/customer/login'
    }
}

async function loadBarbers() {
    const grid = document.querySelector('#panel-1 .selection-grid')
    if (!grid) return

    grid.innerHTML = '<p class="text-muted">Cargando barberos...</p>'

    try {
        const result = await apiFetch('/api/customer/barbers')
        state.barbers = result.data || []

        if (state.barbers.length === 0) {
            grid.innerHTML = '<p class="text-muted">No hay barberos activos disponibles.</p>'
            return
        }

        grid.innerHTML = state.barbers.map((barber) => {
            const name = barber.full_name || 'Barbero'

            return `
                <div class="selection-card"
                    data-id="${escapeHtml(barber.id)}"
                    data-name="${escapeHtml(name)}"
                    data-barbershop-id="${escapeHtml(barber.barbershop_id)}"
                    onclick="selectCard(this, 1)">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222&color=D4AF37" alt="${escapeHtml(name)}">
                    <h5 class="selection-title">${escapeHtml(name)}</h5>
                    <p class="selection-subtitle">${escapeHtml(barber.barbershop_name || 'Barbería')}</p>
                </div>
            `
        }).join('')
    } catch (error) {
        grid.innerHTML = `<p class="text-danger">${escapeHtml(error.message)}</p>`
    }
}

async function loadServices(barbershopId = null) {
    const grid = document.querySelector('#panel-2 .selection-grid')
    if (!grid) return

    grid.innerHTML = '<p class="text-muted">Cargando servicios...</p>'

    try {
        let url = '/api/customer/services'
        if (barbershopId) {
            url += '?barbershop_id=' + encodeURIComponent(barbershopId)
        }

        const result = await apiFetch(url)
        state.services = result.data || []

        if (state.services.length === 0) {
            grid.innerHTML = '<p class="text-muted">No hay servicios activos disponibles.</p>'
            return
        }

        grid.innerHTML = state.services.map((service) => `
            <div class="selection-card"
                data-id="${escapeHtml(service.id)}"
                data-name="${escapeHtml(service.name)}"
                data-price="${escapeHtml(service.price)}"
                data-duration="${escapeHtml(service.duration_minutes)}"
                onclick="selectCard(this, 2)">
                <h5 class="selection-title mt-3">${escapeHtml(service.name)}</h5>
                <p class="text-muted mb-2">${escapeHtml(service.duration_minutes)} minutos</p>
                <p class="selection-subtitle">${formatMoney(service.price)}</p>
            </div>
        `).join('')
    } catch (error) {
        grid.innerHTML = `<p class="text-danger">${escapeHtml(error.message)}</p>`
    }
}

async function loadAppointments() {
    const section = document.querySelector('#my-appointments')
    if (!section) return

    section.querySelectorAll('.appointment-card, .empty-appointments-message').forEach((element) => element.remove())

    try {
        const result = await apiFetch('/api/customer/appointments')
        state.appointments = result.data || []

        if (state.appointments.length === 0) {
            section.insertAdjacentHTML('beforeend', '<p class="text-muted empty-appointments-message">Todavía no tienes citas registradas.</p>')
            return
        }

        const html = state.appointments.map((appointment) => {
            const serviceName = appointment.services?.[0]?.name || 'Servicio'
            const barberName = appointment.barber?.full_name || 'Barbero'
            const date = appointment.appointment_date
            const canCancel = appointment.status !== 'cancelled'

            return `
                <div class="appointment-card">
                    <div class="d-flex align-items-center gap-4">
                        <div class="apt-date">
                            <h3>${escapeHtml(formatDay(date))}</h3>
                            <span>${escapeHtml(formatMonth(date))}</span>
                        </div>
                        <div class="apt-details">
                            <h4>${escapeHtml(serviceName)}</h4>
                            <p><i class="fa-regular fa-clock me-2"></i>${escapeHtml(appointment.start_time?.slice(0, 5))} - con ${escapeHtml(barberName)}</p>
                        </div>
                    </div>
                    <div>
                        ${formatStatus(appointment.status)}
                        ${canCancel ? `<button class="btn btn-outline-danger btn-sm ms-3" onclick="cancelAppointment('${escapeHtml(appointment.id)}')">Cancelar</button>` : ''}
                    </div>
                </div>
            `
        }).join('')

        section.insertAdjacentHTML('beforeend', html)
    } catch (error) {
        section.insertAdjacentHTML('beforeend', `<p class="text-danger empty-appointments-message">${escapeHtml(error.message)}</p>`)
    }
}

async function loadAvailableTimes() {
    const container = document.querySelector('#panel-3 .time-slots')
    if (!container) return

    state.selectedTime = null

    if (!state.selectedBarber || !state.selectedService || !state.selectedDate) {
        container.innerHTML = '<p class="text-muted">Selecciona barbero, servicio y fecha.</p>'
        return
    }

    container.innerHTML = '<p class="text-muted">Cargando horarios...</p>'

    try {
        const params = new URLSearchParams({
            barber_id: state.selectedBarber.id,
            service_id: state.selectedService.id,
            date: state.selectedDate,
        })

        const result = await apiFetch('/api/customer/available-times?' + params.toString())
        const slots = result.data || []

        if (slots.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay horarios disponibles para esa fecha.</p>'
            return
        }

        container.innerHTML = slots.map((slot) => `
            <div class="time-slot ${slot.available ? '' : 'disabled'}"
                data-time="${escapeHtml(slot.time)}"
                onclick="selectTime(this)">
                ${escapeHtml(slot.label)}
            </div>
        `).join('')
    } catch (error) {
        container.innerHTML = `<p class="text-danger">${escapeHtml(error.message)}</p>`
    }
}

function selectCard(element, step) {
    const container = element.parentElement
    container.querySelectorAll('.selection-card').forEach((card) => {
        card.classList.remove('selected')
    })
    element.classList.add('selected')

    if (step === 1) {
        state.selectedBarber = {
            id: element.dataset.id,
            name: element.dataset.name,
            barbershopId: element.dataset.barbershopId,
        }
        state.selectedService = null
        state.selectedTime = null
        loadServices(state.selectedBarber.barbershopId)
    }

    if (step === 2) {
        state.selectedService = {
            id: element.dataset.id,
            name: element.dataset.name,
            price: element.dataset.price,
            duration: element.dataset.duration,
        }
        state.selectedTime = null
        loadAvailableTimes()
    }
}

function selectTime(element) {
    if (element.classList.contains('disabled')) return

    const container = element.parentElement
    container.querySelectorAll('.time-slot').forEach((slot) => {
        slot.classList.remove('selected')
    })

    element.classList.add('selected')
    state.selectedTime = element.dataset.time
}

function showStep(step) {
    document.querySelectorAll('.wizard-panel').forEach((panel) => {
        panel.classList.remove('active')
    })

    document.getElementById('panel-' + step)?.classList.add('active')

    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const current = index + 1
        indicator.classList.remove('active', 'completed')

        if (current < step) indicator.classList.add('completed')
        if (current === step) indicator.classList.add('active')
    })
}

function nextStep(step) {
    if (step === 2 && !state.selectedBarber) {
        alert('Selecciona un barbero antes de continuar.')
        return
    }

    if (step === 3 && !state.selectedService) {
        alert('Selecciona un servicio antes de continuar.')
        return
    }

    if (step === 4) {
        const dateInput = document.querySelector('#panel-3 input[type="date"]')
        state.selectedDate = dateInput?.value || null

        if (!state.selectedDate || !state.selectedTime) {
            alert('Selecciona una fecha y un horario antes de revisar la cita.')
            return
        }

        renderSummary()
    }

    showStep(step)
}

function prevStep(step) {
    showStep(step)
}

function renderSummary() {
    const box = document.querySelector('#panel-4 .summary-box')
    if (!box) return

    box.innerHTML = `
        <i class="fa-solid fa-calendar-check"></i>
        <h3 class="mb-4">${escapeHtml(state.selectedService.name)}</h3>

        <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Barbero:</span>
            <span class="text-white font-weight-bold">${escapeHtml(state.selectedBarber.name)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Fecha:</span>
            <span class="text-white font-weight-bold">${escapeHtml(formatDateLabel(state.selectedDate))}</span>
        </div>
        <div class="d-flex justify-content-between mb-4">
            <span class="text-muted">Hora:</span>
            <span class="text-white font-weight-bold">${escapeHtml(state.selectedTime)}</span>
        </div>

        <div class="d-flex justify-content-between pt-3 border-top border-secondary">
            <span class="text-muted">Precio total:</span>
            <span style="color: var(--primary-gold); font-size: 1.5rem; font-family: 'Oswald', sans-serif;">${formatMoney(state.selectedService.price)}</span>
        </div>
    `
}

async function confirmAppointment() {
    if (!state.selectedBarber || !state.selectedService || !state.selectedDate || !state.selectedTime) {
        alert('Faltan datos para registrar la cita.')
        return
    }

    const button = document.getElementById('confirmAppointmentBtn')
    const originalText = button?.innerHTML

    try {
        if (button) {
            button.disabled = true
            button.innerHTML = 'Guardando...'
        }

        await apiFetch('/api/customer/appointments', {
            method: 'POST',
            body: JSON.stringify({
                barber_id: state.selectedBarber.id,
                service_id: state.selectedService.id,
                appointment_date: state.selectedDate,
                start_time: state.selectedTime,
            }),
        })

        alert('Cita registrada correctamente.')
        await loadAppointments()
        resetWizard()
        switchTab('my-appointments', '/customer/dashboard/my-appointments')
    } catch (error) {
        alert(error.message)
    } finally {
        if (button) {
            button.disabled = false
            button.innerHTML = originalText
        }
    }
}

async function cancelAppointment(appointmentId) {
    if (!confirm('¿Deseas cancelar esta cita?')) return

    try {
        await apiFetch('/api/customer/appointments/' + encodeURIComponent(appointmentId) + '/cancel', {
            method: 'PATCH',
        })

        await loadAppointments()
    } catch (error) {
        alert(error.message)
    }
}

function resetWizard() {
    state.selectedBarber = null
    state.selectedService = null
    state.selectedDate = null
    state.selectedTime = null

    const dateInput = document.querySelector('#panel-3 input[type="date"]')
    if (dateInput) dateInput.value = ''

    document.querySelectorAll('.selection-card, .time-slot').forEach((element) => {
        element.classList.remove('selected')
    })

    showStep(1)
}

function configureEvents() {
    const dateInput = document.querySelector('#panel-3 input[type="date"]')
    if (dateInput) {
        dateInput.min = new Date().toISOString().slice(0, 10)
        dateInput.addEventListener('change', function () {
            state.selectedDate = this.value
            loadAvailableTimes()
        })
    }

    const confirmButton = document.getElementById('confirmAppointmentBtn')
    if (confirmButton) {
        confirmButton.addEventListener('click', confirmAppointment)
    }

    const profileForm = document.getElementById('customerProfileForm')
    if (profileForm) {
        profileForm.addEventListener('submit', function (event) {
            event.preventDefault()
        })
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    configureEvents()
    await loadMe()
    await loadAppointments()
    await loadBarbers()
    await loadServices()
})

window.selectCard = selectCard
window.selectTime = selectTime
window.nextStep = nextStep
window.prevStep = prevStep
window.cancelAppointment = cancelAppointment
