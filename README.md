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
```

Para local, se puede cambiar a:

```env
VITE_API_URL=http://localhost:3001
```

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
