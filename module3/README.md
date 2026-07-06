# Module 3 - Owner Dashboard

Módulo independiente del propietario para SharkHub.

## Ubicación

```text
pandabwbarbershop_frontEnd/module3
```

## Qué incluye

- Dashboard del propietario.
- Edición del perfil de barbería.
- Gestión de barberos por correo.
- Cambio de estado de barberos.
- Supervisión global de citas por fecha y barbero.
- Generación y listado de códigos de invitación.

## Reglas respetadas

- No modifica `modulo1`.
- Usa Vite + React.
- Usa `localStorage.token` y `localStorage.user_role`.
- Usa cliente común en `src/api/api.ts`.
- Las vistas del owner están en `src/components/owner`.

## Ejecución

```bash
cd pandabwbarbershop_frontEnd/module3
npm install
npm run dev
```

Por defecto el cliente API apunta a:

```text
http://localhost:3001
```

Si necesitas cambiarlo, crea un archivo `.env` con:

```text
VITE_API_URL=http://127.0.0.1:8001
```

## Ruta principal

```text
/owner/dashboard
```

Este módulo espera que exista una sesión previa con:

```text
localStorage.token
localStorage.user_role = owner
```
