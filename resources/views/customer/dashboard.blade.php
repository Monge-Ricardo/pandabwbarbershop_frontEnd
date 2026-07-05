<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Área del cliente | SharkHub</title>
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <meta name="description"
        content="→ SharkHub — Área del cliente para agendar citas, gestionar reservas y acceder a servicios de barbería.">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Roboto:wght@300;400;500&display=swap"
        rel="stylesheet">

    <!-- Cache Control -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">

    <!-- Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Dashboard Styles -->
    <link href="/css/dashboard.css" rel="stylesheet">
    <link href="/css/customer-dashboard.css" rel="stylesheet">

    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>

<body>

    <!-- Mobile Sidebar Toggle -->
    <button class="sidebar-toggle" aria-label="Abrir o cerrar menú lateral">
        <i class="fa-solid fa-bars"></i>
    </button>

    <!-- Sidebar -->
    <nav class="sidebar">
        <div class="brand-text">
            <i class="fa-solid fa-scissors"></i> SHARKHUB
        </div>

        <a href="/customer/dashboard/my-appointments" class="nav-link active" data-tab="my-appointments">
            <i class="fa-regular fa-calendar-check"></i> Mis Citas
        </a>
        <a href="/customer/dashboard/book-appointment" class="nav-link" data-tab="book-appointment">
            <i class="fa-solid fa-calendar-plus"></i> Agendar Cita
        </a>
        <a href="/customer/dashboard/profile" class="nav-link" data-tab="profile">
            <i class="fa-solid fa-user-pen"></i> Perfil
        </a>

        <a href="#" class="nav-link logout-mt" id="btnLogout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
        </a>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
        <header class="page-header">
            <div>
                <h2>Bienvenido</h2>
                <p class="text-muted mb-0">Agenda tus citas y accede a los servicios de barbería disponibles.</p>
            </div>
            <div class="user-profile">
<<<<<<< HEAD:06Code/barbershopsharkhub/resources/views/customer/dashboard.html
                <span class="d-none d-sm-block font-weight-bold">Cargando...</span>
                <img src="https://ui-avatars.com/api/?name=Cliente&background=222&color=D4AF37" alt="Cliente"
                    class="avatar">
=======
                <span class="d-none d-sm-block font-weight-bold" id="customerName">Cargando...</span>
                <img src="" alt="Client" class="avatar" id="customerAvatar">
>>>>>>> OAuth-Ricardo:06Code/barbershopsharkhub/resources/views/customer/dashboard.blade.php
            </div>
        </header>

        <!-- Tab: My Appointments -->
        <section id="my-appointments" class="content-section active">
            <h3 class="section-title">Citas Próximas</h3>

            <p class="text-muted empty-appointments-message">Cargando citas...</p>
        </section>

        <!-- Tab: Book Appointment Wizard -->
        <section id="book-appointment" class="content-section">
            <h3 class="section-title">Agendar Nueva Cita</h3>

            <div class="wizard-container">
                <div class="wizard-steps">
                    <div class="step-indicator active" id="step-ind-1">1</div>
                    <div class="step-indicator" id="step-ind-2">2</div>
                    <div class="step-indicator" id="step-ind-3">3</div>
                    <div class="step-indicator" id="step-ind-4"><i class="fa-solid fa-check"></i></div>
                </div>

                <!-- Step 1: Select Barber -->
                <div class="wizard-panel active" id="panel-1">
                    <h4 class="wizard-step-title mb-4">Elige tu Barbero</h4>
                    <div class="selection-grid">
                        <p class="text-muted">Cargando barberos...</p>
                    </div>
                    <div class="wizard-actions">
                        <div></div>
                        <button class="btn btn-gold" onclick="nextStep(2)">Siguiente Paso<i
                                class="fa-solid fa-arrow-right ms-2"></i></button>
                    </div>
                </div>

                <!-- Step 2: Select Service -->
                <div class="wizard-panel" id="panel-2">
                    <h4 class="wizard-step-title mb-4">Selecciona un servicio</h4>
                    <div class="selection-grid">
                        <p class="text-muted">Cargando servicios...</p>
                    </div>
                    <div class="wizard-actions">
                        <button class="btn btn-outline" onclick="prevStep(1)"><i
                                class="fa-solid fa-arrow-left me-2"></i>Atras</button>
                        <button class="btn btn-gold" onclick="nextStep(3)">Siguiente Paso <i
                                class="fa-solid fa-arrow-right ms-2"></i></button>
                    </div>
                </div>

                <!-- Step 3: Date & Time -->
                <div class="wizard-panel" id="panel-3">
                    <h4 class="wizard-step-title mb-4">Seleccionar Fecha y Hora</h4>

                    <div class="row g-4">
                        <div class="col-md-6">
                            <label class="text-muted mb-2 font-weight-bold">Elegir una Fecha</label>
                            <input type="date" class="form-control bg-dark text-white border-secondary p-3">
                        </div>
                        <div class="col-md-6">
                            <label class="text-muted mb-2 font-weight-bold">Horarios Disponibles</label>
                            <div class="time-slots">
                                <p class="text-muted">Selecciona barbero, servicio y fecha.</p>
                            </div>
                        </div>
                    </div>

                    <div class="wizard-actions">
                        <button class="btn btn-outline" onclick="prevStep(2)"><i
                                class="fa-solid fa-arrow-left me-2"></i> Atras</button>
                        <button class="btn btn-gold" onclick="nextStep(4)">Revisar <i
                                class="fa-solid fa-eye ms-2"></i></button>
                    </div>
                </div>

                <!-- Step 4: Summary -->
                <div class="wizard-panel" id="panel-4">
                    <h4 class="wizard-step-title mb-4 text-center">Confirma tu reserva</h4>

                    <div class="summary-box mx-auto" style="max-width: 500px;">
                        <p class="text-muted mb-0">Completa los pasos anteriores para revisar tu cita.</p>
                    </div>

                    <div class="wizard-actions">
                        <button class="btn btn-outline" onclick="prevStep(3)"><i
                                class="fa-solid fa-arrow-left me-2"></i> Atras</button>
                        <button type="button" class="btn btn-gold" id="confirmAppointmentBtn">
                            Confirmar Cita <i class="fa-solid fa-check ms-2"></i>
                        </button>
                    </div>
                </div>

            </div>
        </section>

        <!-- Tab: Profile -->
        <section id="profile" class="content-section">
            <h3 class="section-title">Mi Perfil</h3>

            <div class="panel-card dashboard-form">
                <form id="customerProfileForm">
                    <div class="row g-4">
                        <div class="col-md-6">
                            <label class="form-label">Nombre</label>
                            <input type="text" class="form-control" id="profileFirstName" value="">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Apellido</label>
                            <input type="text" class="form-control" id="profileLastName" value="">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Correo electrónico</label>
                            <input type="email" class="form-control" id="profileEmail" value="">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Teléfono</label>
                            <input type="tel" class="form-control" id="profilePhone" value="">
                        </div>
                        <div class="col-12 text-end mt-4">
                            <button type="button" class="btn btn-gold" id="saveCustomerProfileBtn">Guardar
                                Cambios</button>
                        </div>
                    </div>
                </form>
            </div>
        </section>

    </main>

    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/dashboard-common.js"></script>
<<<<<<< HEAD:06Code/barbershopsharkhub/resources/views/customer/dashboard.html
    <script src="/js/customer-dashboard.js?v=6"></script>
=======
    <script src="/js/customer-dashboard.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', async function () {
        try {
            // Initialize Supabase Client
            const supabaseUrl = '{{ env("SUPABASE_URL") }}';
            const supabaseAnonKey = '{{ env("SUPABASE_ANON_KEY") }}';
            const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

            // Function to verify session
            async function verifySession() {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) { 
                    window.location.replace('/'); 
                    return false; 
                }
                return session;
            }

            const session = await verifySession();
            if (!session) return;

            // Extract user info from session metadata (or Google profile)
            const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Cliente';
            document.getElementById('customerName').textContent = name;
            
            const avatarUrl = session.user.user_metadata?.avatar_url || 
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=222&color=D4AF37';
            document.getElementById('customerAvatar').src = avatarUrl;

            // Handle Logout
            document.getElementById('btnLogout').addEventListener('click', async (e) => {
                e.preventDefault();
                // Ocultar el contenido inmediatamente para que si usan 'Atrás', no vean la sesión anterior
                document.body.style.display = 'none';
                await supabase.auth.signOut();
                window.location.href = '/';
            });

            // Handle bfcache (Botón de Atrás del navegador)
            window.addEventListener('pageshow', async function(event) {
                if (event.persisted) {
                    await verifySession();
                }
            });

        } catch(e) { 
            console.error(e); 
            window.location.replace('/');
        }
    });
    </script>
>>>>>>> OAuth-Ricardo:06Code/barbershopsharkhub/resources/views/customer/dashboard.blade.php
</body>

</html>