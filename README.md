# Modules Unificated - SharkHub Frontend

Frontend integrado para despliegue final. Une el Módulo 1 `customer` y el Módulo 3 `owner` sin modificar las carpetas originales `modulo1` y `module3`.

## Módulos incluidos

- Landing Page.
- Login / Registro.
- Dashboard Customer.
- Dashboard Owner.
- Placeholder para Dashboard Barber.

## Ejecución local

```bash
npm install
npm run dev
```

## Variables de entorno

Crear `.env` a partir de `.env.example`:

```env
VITE_API_URL=https://pandabarbershop.com
VITE_GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
```

Para local, se puede cambiar a:

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=TU_API_KEY_DE_GOOGLE_MAPS
```

## Google Maps & Multisucursal
El proyecto cuenta con integración completa a la API de Google Maps:
1. **Autocompletado de Direcciones (Google Places Autocomplete):** Al registrar o actualizar una sucursal en el panel del Owner, el campo de dirección cuenta con autocompletador inteligente. Éste calcula y guarda la dirección formateada y las coordenadas (`latitude` y `longitude`) en la base de datos automáticamente.
2. **Mapa Dinámico (Landing Page):** La sección de contactos renderiza un mapa de Google Maps dinámico en tema oscuro. Éste consume las sucursales de la base de datos y coloca marcadores interactivos para cada una.
3. **Multisucursal:** El Owner puede crear múltiples barberías (sucursales). En el dashboard del Owner aparecerá un selector en la cabecera si posee más de una sucursal activa, permitiéndole alternar la gestión de barberos, citas e invitaciones de forma individual (inyectando de forma transparente la cabecera `X-Barbershop-Id` en las peticiones HTTP).

## Rutas principales

```text
/
/login
/register
/customer/dashboard
/owner/dashboard
```

## Caché

El cliente API compartido incluye caché para lecturas `GET` frecuentes. Las mutaciones del Owner limpian la caché para evitar mostrar información antigua.

## Despliegue con Docker

```bash
docker compose build --build-arg VITE_API_URL=https://pandabarbershop.com
docker compose up -d
```

También puede usarse:

```bash
VITE_API_URL=https://pandabarbershop.com docker compose up -d --build
```
