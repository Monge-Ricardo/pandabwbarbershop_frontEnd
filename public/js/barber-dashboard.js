/* ==========================================================================
   SharkHub Barber Dashboard — agenda, services and products.
   Loads the logged-in barber, lists real appointments and updates their status.
   ========================================================================== */

'use strict'

const state = {
    user: null,
    barbershopId: null,
    appointments: [],
    products: [],
    services: [],
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

function getModalInstance(modalId) {
    const modalElement = document.getElementById(modalId)

    if (!modalElement) {
        console.error(`No existe el modal con id: ${modalId}`)
        return null
    }

    let modal = bootstrap.Modal.getInstance(modalElement)

    if (!modal) {
        modal = new bootstrap.Modal(modalElement)
    }

    return modal
}

function hideModal(modalId) {
    const modal = getModalInstance(modalId)

    if (modal) {
        modal.hide()
    }
}

function formatPrice(value) {
    return `$${parseFloat(value || 0).toFixed(2)}`
}

function formatTime(value) {
    if (!value) return ''

    const [hourValue, minuteValue] = String(value).split(':')
    const hour = Number(hourValue)
    const minute = minuteValue || '00'
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12

    return `${formattedHour}:${minute} ${suffix}`
}

function formatStatus(status) {
    if (status === 'confirmed') {
        return '<span class="status-badge status-confirmed">Confirmado</span>'
    }

    if (status === 'cancelled') {
        return '<span class="status-badge status-cancelled">Cancelado</span>'
    }

    return '<span class="status-badge status-pending">Pendiente</span>'
}

function getAgendaDateFromUrl() {
    const params = new URLSearchParams(window.location.search)

    return params.get('date')
}

function updateAgendaDateInUrl(dateValue) {
    const baseUrl = '/barber/dashboard/agenda'
    const nextUrl = dateValue
        ? `${baseUrl}?date=${encodeURIComponent(dateValue)}`
        : baseUrl

    const currentUrl = window.location.pathname + window.location.search

    if (currentUrl !== nextUrl) {
        window.history.pushState(
            {
                tabId: 'agenda',
                date: dateValue
            },
            '',
            nextUrl
        )
    }
}

function getBarberAppointmentsEndpoint(dateValue = null) {
    if (!dateValue) {
        return '/api/barber/appointments'
    }

    return `/api/barber/appointments?date=${encodeURIComponent(dateValue)}`
}

async function loadMe() {
    const result = await apiFetch('/api/me')
    state.user = result.user
    state.barbershopId = result.user?.barbershop_id || null

    if (state.user?.role !== 'barber') {
        throw new Error('La sesión actual no pertenece a un barbero activo.')
    }

    const name = state.user?.name || 'Barbero'
    const profileName = document.getElementById('barberProfileName')
    const profileRole = document.getElementById('barberProfileRole')
    const profileAvatar = document.getElementById('barberProfileAvatar')

    if (profileName) profileName.textContent = name
    if (profileRole) profileRole.textContent = 'Barbero'
    if (profileAvatar) {
        profileAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=D4AF37&color=000'
        profileAvatar.alt = name
    }
}

async function loadBarberAppointments(dateValue = null) {
    const tableBody = document.getElementById('barberAppointmentsTableBody')

    if (!tableBody) return

    const selectedDate = dateValue || getAgendaDateFromUrl()
    const endpoint = getBarberAppointmentsEndpoint(selectedDate)

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted">Cargando citas...</td>
        </tr>
    `

    try {
        const result = await apiFetch(endpoint)
        state.appointments = result.data || []

        const todayCounter = document.getElementById('todayAppointmentsCount')
        const pendingCounter = document.getElementById('pendingAppointmentsCount')

        if (todayCounter) todayCounter.textContent = result.stats?.today_appointments ?? 0
        if (pendingCounter) pendingCounter.textContent = result.stats?.pending_requests ?? 0

        if (state.appointments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">No hay citas para mostrar.</td>
                </tr>
            `
            return
        }

        tableBody.innerHTML = state.appointments.map((appointment) => {
            const clientName = appointment.client?.full_name || 'Cliente'
            const serviceName = appointment.services?.map((service) => service.name).join(', ') || 'Servicio'
            const canConfirm = appointment.status === 'pending'
            const canCancel = appointment.status !== 'cancelled'

            return `
                <tr>
                    <td>${escapeHtml(formatTime(appointment.start_time))}</td>
                    <td>${escapeHtml(clientName)}</td>
                    <td>${escapeHtml(serviceName)}</td>
                    <td>${formatStatus(appointment.status)}</td>
                    <td>
                        ${canConfirm ? `<button type="button" class="btn btn-outline-gold btn-sm me-2" onclick="confirmBarberAppointment('${escapeHtml(appointment.id)}')">Confirmar</button>` : ''}
                        ${canCancel ? `<button type="button" class="btn btn-outline-danger btn-sm" onclick="cancelBarberAppointment('${escapeHtml(appointment.id)}')">Cancelar</button>` : ''}
                    </td>
                </tr>
            `
        }).join('')
    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">${escapeHtml(error.message)}</td>
            </tr>
        `
    }
}

async function confirmBarberAppointment(appointmentId) {
    if (!confirm('¿Deseas confirmar esta cita?')) return

    try {
        await apiFetch('/api/barber/appointments/' + encodeURIComponent(appointmentId) + '/confirm', {
            method: 'PATCH',
        })

        await loadBarberAppointments(getAgendaDateFromUrl())
    } catch (error) {
        alert(error.message)
    }
}

async function cancelBarberAppointment(appointmentId) {
    if (!confirm('¿Deseas cancelar esta cita?')) return

    try {
        await apiFetch('/api/barber/appointments/' + encodeURIComponent(appointmentId) + '/cancel', {
            method: 'PATCH',
        })

        await loadBarberAppointments()
    } catch (error) {
        alert(error.message)
    }
}

/**
 * Load Services
 */
async function loadServices() {
    const tbody = document.querySelector('#services tbody')

    if (!tbody) return

    if (!state.barbershopId) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">No se encontró la barbería del barbero.</td>
            </tr>
        `
        return
    }

    try {
        const services = await apiFetch(`/api/barber/services?barbershop_id=${encodeURIComponent(state.barbershopId)}`)
        tbody.innerHTML = ''

        if (services.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">No hay servicios registrados.</td>
                </tr>
            `
            state.services = []
            return
        }

        services.forEach(service => {
            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td>${escapeHtml(service.name)}</td>
                <td>${escapeHtml(service.description || 'Sin descripción')}</td>
                <td>${escapeHtml(service.duration_minutes || 0)} min</td>
                <td>${formatPrice(service.price)}</td>
            `
            tbody.appendChild(tr)
        })

        state.services = services
    } catch (error) {
        console.error('Error cargando servicios:', error)
    }
}

function setupServiceActions() {
    const openEditServicesModalBtn = document.getElementById('openEditServicesModalBtn')
    const openDeleteServicesModalBtn = document.getElementById('openDeleteServicesModalBtn')
    const confirmEditServiceBtn = document.getElementById('confirmEditServiceBtn')
    const confirmDeleteServicesBtn = document.getElementById('confirmDeleteServicesBtn')

    if (openEditServicesModalBtn) {
        openEditServicesModalBtn.addEventListener('click', function () {
            const tableBody = document.getElementById('editServicesTableBody')
            tableBody.innerHTML = ''

            if (state.services.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">
                            No hay servicios disponibles para editar.
                        </td>
                    </tr>
                `
            } else {
                state.services.forEach(service => {
                    const row = document.createElement('tr')

                    row.innerHTML = `
                        <td>
                            <input type="radio" name="edit-service-radio" class="edit-service-radio" value="${escapeHtml(service.id)}">
                        </td>
                        <td>${escapeHtml(service.name)}</td>
                        <td>${escapeHtml(service.duration_minutes || 0)} min</td>
                        <td>${formatPrice(service.price)}</td>
                    `

                    tableBody.appendChild(row)
                })
            }

            getModalInstance('editServicesModal').show()
        })
    }

    if (confirmEditServiceBtn) {
        confirmEditServiceBtn.addEventListener('click', async function () {
            const selectedService = document.querySelector('.edit-service-radio:checked')

            if (!selectedService) {
                alert('Selecciona un servicio para editar.')
                return
            }

            hideModal('editServicesModal')
            await editService(selectedService.value)
        })
    }

    if (openDeleteServicesModalBtn) {
        openDeleteServicesModalBtn.addEventListener('click', function () {
            const tableBody = document.getElementById('deleteServicesTableBody')
            tableBody.innerHTML = ''

            if (state.services.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">
                            No hay servicios disponibles para eliminar.
                        </td>
                    </tr>
                `
            } else {
                state.services.forEach(service => {
                    const row = document.createElement('tr')

                    row.innerHTML = `
                        <td>
                            <input type="checkbox" class="delete-service-checkbox" value="${escapeHtml(service.id)}">
                        </td>
                        <td>${escapeHtml(service.name)}</td>
                        <td>${escapeHtml(service.duration_minutes || 0)} min</td>
                        <td>${formatPrice(service.price)}</td>
                    `

                    tableBody.appendChild(row)
                })
            }

            getModalInstance('deleteServicesModal').show()
        })
    }

    if (confirmDeleteServicesBtn) {
        confirmDeleteServicesBtn.addEventListener('click', async function () {
            const selectedCheckboxes = document.querySelectorAll('.delete-service-checkbox:checked')

            if (selectedCheckboxes.length === 0) {
                alert('Selecciona al menos un servicio.')
                return
            }

            for (const checkbox of selectedCheckboxes) {
                await deleteService(checkbox.value)
            }

            hideModal('deleteServicesModal')
            await loadServices()
        })
    }
}

function openServiceModal() {
    document.getElementById('serviceForm').reset()
    document.getElementById('serviceId').value = ''
    document.getElementById('serviceModalLabel').innerText = 'Agregar Servicio'
    getModalInstance('serviceModal').show()
}

async function editService(id) {
    const service = state.services.find(currentService => currentService.id === id)

    if (!service) {
        return
    }

    document.getElementById('serviceId').value = service.id
    document.getElementById('serviceName').value = service.name
    document.getElementById('serviceDescription').value = service.description || ''
    document.getElementById('servicePrice').value = service.price
    document.getElementById('serviceDuration').value = service.duration_minutes
    document.getElementById('serviceModalLabel').innerText = 'Editar Servicio'

    getModalInstance('serviceModal').show()
}

async function deleteService(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
        return false
    }

    try {
        await apiFetch(`/api/barber/services/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        })

        return true
    } catch (error) {
        alert(error.message)
        return false
    }
}

function setupServiceForm() {
    const serviceForm = document.getElementById('serviceForm')

    if (!serviceForm) return

    serviceForm.addEventListener('submit', async function (e) {
        e.preventDefault()

        const id = document.getElementById('serviceId').value
        const data = {
            name: document.getElementById('serviceName').value,
            description: document.getElementById('serviceDescription').value,
            price: parseFloat(document.getElementById('servicePrice').value),
            duration_minutes: parseInt(document.getElementById('serviceDuration').value),
            barbershop_id: state.barbershopId,
        }

        try {
            const url = id ? `/api/barber/services/${encodeURIComponent(id)}` : '/api/barber/services'
            const method = id ? 'PUT' : 'POST'

            await apiFetch(url, {
                method: method,
                body: JSON.stringify(data),
            })

            hideModal('serviceModal')
            await loadServices()
        } catch (error) {
            alert(error.message)
        }
    })
}

/**
 * Load Products
 */
async function loadProducts() {
    const tbody = document.querySelector('#products tbody')

    if (!tbody) return

    if (!state.barbershopId) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">No se encontró la barbería del barbero.</td>
            </tr>
        `
        return
    }

    try {
        const products = await apiFetch(`/api/barber/products?barbershop_id=${encodeURIComponent(state.barbershopId)}`)
        tbody.innerHTML = ''

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">No hay productos registrados.</td>
                </tr>
            `
            state.products = []
            return
        }

        products.forEach(product => {
            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.description || 'Sin descripción')}</td>
                <td>${escapeHtml(product.stock || 0)}</td>
                <td>${formatPrice(product.price)}</td>
            `
            tbody.appendChild(tr)
        })

        state.products = products
    } catch (error) {
        console.error('Error cargando productos:', error)
    }
}

function setupProductActions() {
    const openEditProductsModalBtn = document.getElementById('openEditProductsModalBtn')
    const openDeleteProductsModalBtn = document.getElementById('openDeleteProductsModalBtn')
    const confirmEditProductBtn = document.getElementById('confirmEditProductBtn')
    const confirmDeleteProductsBtn = document.getElementById('confirmDeleteProductsBtn')

    if (openEditProductsModalBtn) {
        openEditProductsModalBtn.addEventListener('click', function () {
            const tableBody = document.getElementById('editProductsTableBody')

            if (!tableBody) {
                console.error('No existe editProductsTableBody en el HTML.')
                return
            }

            tableBody.innerHTML = ''

            if (state.products.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">
                            No hay productos disponibles para editar.
                        </td>
                    </tr>
                `
            } else {
                state.products.forEach(product => {
                    const row = document.createElement('tr')

                    row.innerHTML = `
                        <td>
                            <input type="radio" name="edit-product-radio" class="edit-product-radio" value="${escapeHtml(product.id)}">
                        </td>
                        <td>${escapeHtml(product.name)}</td>
                        <td>${escapeHtml(product.stock || 0)}</td>
                        <td>${formatPrice(product.price)}</td>
                    `

                    tableBody.appendChild(row)
                })
            }

            const modal = getModalInstance('editProductsModal')

            if (modal) {
                modal.show()
            }
        })
    }

    if (confirmEditProductBtn) {
        confirmEditProductBtn.addEventListener('click', async function () {
            const selectedProduct = document.querySelector('.edit-product-radio:checked')

            if (!selectedProduct) {
                alert('Selecciona un producto para editar.')
                return
            }

            hideModal('editProductsModal')
            await editProduct(selectedProduct.value)
        })
    }

    if (openDeleteProductsModalBtn) {
        openDeleteProductsModalBtn.addEventListener('click', function () {
            const tableBody = document.getElementById('deleteProductsTableBody')

            if (!tableBody) {
                console.error('No existe deleteProductsTableBody en el HTML.')
                return
            }

            tableBody.innerHTML = ''

            if (state.products.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">
                            No hay productos disponibles para eliminar.
                        </td>
                    </tr>
                `
            } else {
                state.products.forEach(product => {
                    const row = document.createElement('tr')

                    row.innerHTML = `
                        <td>
                            <input type="checkbox" class="delete-product-checkbox" value="${escapeHtml(product.id)}">
                        </td>
                        <td>${escapeHtml(product.name)}</td>
                        <td>${escapeHtml(product.stock || 0)}</td>
                        <td>${formatPrice(product.price)}</td>
                    `

                    tableBody.appendChild(row)
                })
            }

            const modal = getModalInstance('deleteProductsModal')

            if (modal) {
                modal.show()
            }
        })
    }

    if (confirmDeleteProductsBtn) {
        confirmDeleteProductsBtn.addEventListener('click', async function () {
            const selectedCheckboxes = document.querySelectorAll('.delete-product-checkbox:checked')

            if (selectedCheckboxes.length === 0) {
                alert('Selecciona al menos un producto.')
                return
            }

            for (const checkbox of selectedCheckboxes) {
                await deleteProduct(checkbox.value)
            }

            hideModal('deleteProductsModal')
            await loadProducts()
        })
    }
}

function openProductModal() {
    document.getElementById('productForm').reset()
    document.getElementById('productId').value = ''
    document.getElementById('productModalLabel').innerText = 'Agregar Producto'
    getModalInstance('productModal').show()
}

async function editProduct(id) {
    const product = state.products.find(currentProduct => currentProduct.id === id)

    if (!product) {
        return
    }

    document.getElementById('productId').value = product.id
    document.getElementById('productName').value = product.name
    document.getElementById('productDescription').value = product.description || ''
    document.getElementById('productPrice').value = product.price
    document.getElementById('productStock').value = product.stock
    document.getElementById('productModalLabel').innerText = 'Editar Producto'

    getModalInstance('productModal').show()
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return false

    try {
        await apiFetch(`/api/barber/products/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        })

        return true
    } catch (error) {
        alert(error.message)
        return false
    }
}

function setupProductForm() {
    const productForm = document.getElementById('productForm')

    if (!productForm) return

    productForm.addEventListener('submit', async function (e) {
        e.preventDefault()

        const id = document.getElementById('productId').value
        const data = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            barbershop_id: state.barbershopId,
        }

        try {
            const url = id ? `/api/barber/products/${encodeURIComponent(id)}` : '/api/barber/products'
            const method = id ? 'PUT' : 'POST'

            await apiFetch(url, {
                method: method,
                body: JSON.stringify(data),
            })

            hideModal('productModal')
            await loadProducts()
        } catch (error) {
            alert(error.message)
        }
    })
}

function configureEvents() {
    const addServiceBtn = document.querySelector('#services [data-bs-target="#serviceModal"]')
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => openServiceModal())
    }

    const addProductBtn = document.querySelector('#products [data-bs-target="#productModal"]')
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openProductModal())
    }

    const appointmentDateFilter = document.getElementById('appointmentDateFilter')

    if (appointmentDateFilter) {
        const dateFromUrl = getAgendaDateFromUrl()

        if (dateFromUrl) {
            appointmentDateFilter.value = dateFromUrl
        }

        appointmentDateFilter.addEventListener('change', function () {
            updateAgendaDateInUrl(this.value)
            loadBarberAppointments(this.value)
        })
    }

    setupServiceActions()
    setupProductActions()
    setupServiceForm()
    setupProductForm()
}

document.addEventListener('DOMContentLoaded', async function () {
    configureEvents()

    try {
        await loadMe()
        await Promise.all([
            loadBarberAppointments(getAgendaDateFromUrl()),
            loadServices(),
            loadProducts(),
        ])
    } catch (error) {
        console.error(error)
        alert(error.message)
        window.location.href = '/'
    }
})

window.confirmBarberAppointment = confirmBarberAppointment
window.cancelBarberAppointment = cancelBarberAppointment
