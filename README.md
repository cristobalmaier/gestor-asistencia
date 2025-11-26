# Gestor de Asistencia

Sistema de gestión de asistencia con frontend en React y backend en Node.js/Express usando Supabase como base de datos.

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Supabase con proyecto configurado

## 🚀 Instalación y Configuración

### 1. Configurar Variables de Entorno del Backend

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# Supabase Configuration (REQUERIDO)
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key

# JWT Secret (Opcional - tiene valor por defecto)
JWT_SECRET=tu_secret_key_segura

# Puerto del servidor (Opcional - por defecto 4000)
PORT=4000
```

**Nota:** Puedes encontrar estas credenciales en tu proyecto de Supabase:
- Ve a Settings → API
- `SUPABASE_URL` es tu "Project URL"
- `SUPABASE_ANON_KEY` es tu "anon public" key
- `SUPABASE_SERVICE_ROLE_KEY` es tu "service_role" key (manténla segura)

### 2. Configurar Variables de Entorno del Frontend (Opcional)

Crea un archivo `.env` en la carpeta `frontend/` si necesitas cambiar la URL del API:

```env
VITE_API_URL=http://localhost:4000/api
```

**Nota:** Si no creas este archivo, el frontend usará `http://localhost:4000/api` por defecto.

### 3. Instalar Dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

## ▶️ Ejecutar el Programa

### Modo Desarrollo

Necesitas ejecutar tanto el backend como el frontend en terminales separadas:

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

El backend se ejecutará en `http://localhost:4000` (o el puerto que hayas configurado).

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

El frontend se ejecutará en `http://localhost:5173` y se abrirá automáticamente en tu navegador.

### Modo Producción

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📝 Scripts Disponibles

### Backend
- `npm run dev` - Ejecuta el servidor en modo desarrollo con nodemon (recarga automática)
- `npm start` - Ejecuta el servidor en modo producción
- `npm run seed:admin` - Crea un usuario administrador inicial
- `npm run setup:admin` - Configura un usuario administrador

### Frontend
- `npm run dev` - Ejecuta el servidor de desarrollo de Vite
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## 🔧 Solución de Problemas

### Error: "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos"
- Asegúrate de haber creado el archivo `.env` en la carpeta `backend/`
- Verifica que las variables estén correctamente escritas (sin espacios extra)
- Asegúrate de que el archivo `.env` esté en la raíz de la carpeta `backend/`

### El frontend no se conecta al backend
- Verifica que el backend esté ejecutándose en el puerto correcto (por defecto 4000)
- Revisa que la variable `VITE_API_URL` en el frontend apunte al puerto correcto
- Asegúrate de que CORS esté habilitado en el backend (ya está configurado por defecto)

### Error de conexión a Supabase
- Verifica que las credenciales de Supabase sean correctas
- Asegúrate de que tu proyecto de Supabase esté activo
- Revisa que las tablas necesarias estén creadas en tu base de datos

## 📁 Estructura del Proyecto

```
gestor-asistencia/
├── backend/          # Servidor Node.js/Express
│   ├── src/
│   │   ├── routes/   # Rutas de la API
│   │   ├── middleware/# Middleware de autenticación
│   │   └── server.js # Punto de entrada del servidor
│   └── package.json
├── frontend/         # Aplicación React
│   ├── src/
│   │   ├── pages/     # Páginas de la aplicación
│   │   ├── components/# Componentes reutilizables
│   │   └── services/  # Servicios de API
│   └── package.json
└── bd/                # Scripts SQL de base de datos
```

## 🔐 Seguridad

- **NUNCA** subas el archivo `.env` a un repositorio público
- Mantén tu `SUPABASE_SERVICE_ROLE_KEY` segura (tiene permisos completos)
- Usa un `JWT_SECRET` fuerte y único en producción
- Considera usar variables de entorno del sistema en lugar de archivos `.env` en producción


