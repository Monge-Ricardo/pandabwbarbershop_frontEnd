<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Inicio de sesión | SharkHub</title>
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <!-- Icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body { font-family: 'Roboto', sans-serif; background-color: #121212; color: #fff; }
        .form-wrapper { background: #1e1e1e; padding: 2rem; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .btn-submit-custom { background: #D4AF37; color: #000; border: none; padding: 10px 20px; border-radius: 4px; width: 100%; font-weight: bold; }
        .btn-submit-custom:hover { background: #b5952f; }
        .btn-google { 
            background: rgba(255, 255, 255, 0.05); 
            color: #fff; 
            border: 1px solid rgba(255, 255, 255, 0.15); 
            padding: 1.2rem; 
            border-radius: 10px; 
            width: 100%; 
            font-weight: 600; 
            font-size: 1.05rem;
            margin-bottom: 1.5rem; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 12px;
            transition: all 0.3s ease;
            letter-spacing: 1px;
            font-family: 'Oswald', sans-serif;
            text-transform: uppercase;
        }
        .btn-google:hover { 
            background: rgba(255, 255, 255, 1); 
            color: #000;
            border-color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(255, 255, 255, 0.2);
        }
        .form-control-custom { background: #333; border: 1px solid #444; color: #fff; }
        .form-control-custom:focus { background: #444; border-color: #D4AF37; color: #fff; box-shadow: none; }
        .form-label-custom { color: #aaa; }
        .form-footer a { color: #D4AF37; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <main id="main-content" class="d-flex align-items-center justify-content-center" style="min-height: 100vh;">
        <div class="container-xxl py-5">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-lg-6 wow fadeIn" data-wow-delay="0.1s">
                        <div class="form-wrapper mx-auto">
                            <div class="form-header text-center mb-4">
                                <h2 class="text-center" style="font-size: 2.2rem; font-family: 'Oswald', sans-serif;">Inicio de sesión</h2>
                                <p class="text-center mt-2">Ingresa tus credenciales para continuar.</p>
                            </div>

                            <!-- Google Auth Button -->
                            <button type="button" id="btnGoogleLogin" class="btn-google">
                                <i class="fab fa-google"></i> Iniciar sesión con Google
                            </button>
                            
                            <div class="text-center mb-3">
                                <span class="text-muted">o usa tu correo electrónico</span>
                            </div>

                            <form id="loginForm" action="#" method="POST">
                                <div class="row g-4">
                                    <div class="col-12 form-group mb-0">
                                        <label class="form-label-custom" for="email">Correo electrónico</label>
                                        <input type="email" class="form-control form-control-custom" id="email" name="email" placeholder="Ingresa tu correo" required>
                                    </div>
                                    <div class="col-12 form-group mb-0">
                                        <label class="form-label-custom" for="password">Contraseña</label>
                                        <input type="password" class="form-control form-control-custom" id="password" name="password" placeholder="Ingresa tu contraseña" required>
                                    </div>
                                    <div class="col-12 mt-4">
                                        <button class="btn-submit-custom" type="submit" id="btnEmailLogin">Iniciar Sesión <i class="fas fa-sign-in-alt ms-2"></i></button>
                                    </div>
                                    <div class="col-12 text-center mt-3">
                                        <div class="form-footer">
                                            ¿No tienes una cuenta? <a href="/customer/register">Regístrate aquí</a>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        // Initialize Supabase Client
        const supabaseUrl = '{{ env("SUPABASE_URL") }}';
        const supabaseAnonKey = '{{ env("SUPABASE_ANON_KEY") }}';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

        // Check if already logged in
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                window.location.href = '/customer/dashboard';
            }
        }
        checkSession();

        // Google Auth Logic
        document.getElementById('btnGoogleLogin').addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("Iniciando login con Google...");
            try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/customer/dashboard'
                    }
                });
                if (error) {
                    console.error("Error OAuth:", error);
                    alert('Error iniciando sesión con Google: ' + error.message);
                }
            } catch (err) {
                console.error("Excepción en OAuth:", err);
                alert("Ocurrió un error inesperado al intentar conectar con Google.");
            }
        });

        // Email Auth Logic (Optional/Legacy support)
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                alert('Error iniciando sesión: ' + error.message);
            } else {
                window.location.href = '/customer/dashboard';
            }
        });
    </script>
</body>
</html>