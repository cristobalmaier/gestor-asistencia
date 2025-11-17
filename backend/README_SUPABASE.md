# Migración a Supabase

Este proyecto ha sido migrado de MySQL (XAMPP) a Supabase (PostgreSQL).

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT Secret (para tokens propios)
JWT_SECRET=super_secret_jwt_key

# Server Port
PORT=4000

# Environment
NODE_ENV=development
```

### 2. Obtener las credenciales de Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Ve a Settings → API
3. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon public key** → `SUPABASE_ANON_KEY`

### 3. Instalar dependencias

```bash
cd backend
npm install
```

Esto instalará `@supabase/supabase-js` en lugar de `mysql2`.

## Cambios Principales

### Esquema de Base de Datos

El esquema ha cambiado significativamente:

- **usuarios** → `auth.users` + `user_roles` / `usuarios_roles` + `teachers` / `padres`
- **alumnos** → `alumno` (tabla)
- **cursos** → `curso` (estructura diferente: `curso` y `turno` en lugar de `nombre`, `anio`, `division`)
- **asistencias** → `asistencias` (usa `presente` boolean y `justificada` boolean en lugar de `estado` string)
- **materias** → `materias` (similar pero con `curso_id` en lugar de `id_curso`)
- **calendario** → `eventos` (usa `fecha_inicio` timestamp en lugar de `fecha` date)
- **historial** → No hay tabla equivalente directa (puedes crear una si es necesario)

### Autenticación

La autenticación ahora puede usar:
1. **Supabase Auth** (`auth.users`) - Recomendado para producción
2. **Tabla `teachers`** con contraseñas hasheadas - Para compatibilidad

### Consultas SQL

Todas las consultas SQL han sido reemplazadas por el cliente de Supabase que usa PostgREST. Las funciones helper en `db.js` facilitan la migración.

## Notas Importantes

1. **UUIDs**: Supabase usa UUIDs en lugar de INTs para los IDs
2. **Timestamps**: Usa `timestamp with time zone` en lugar de `datetime`
3. **Booleanos**: Las asistencias usan `presente` y `justificada` (booleanos) en lugar de un campo `estado` (string)
4. **Relaciones**: Algunas relaciones han cambiado (ej: `alumno.id_curso` directo en lugar de tabla intermedia `alumnos_cursos`)

## Próximos Pasos

1. Configurar las variables de entorno
2. Verificar que todas las tablas existan en Supabase
3. Migrar los datos existentes (si los hay)
4. Probar todas las funcionalidades
5. Ajustar el frontend si es necesario para los cambios en el formato de datos

## Solución de Problemas

### Error: "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos"
- Verifica que el archivo `.env` existe y tiene las variables correctas

### Error: "relation does not exist"
- Verifica que todas las tablas del esquema SQL de Supabase estén creadas

### Error 401 en autenticación
- Verifica que el JWT_SECRET sea el mismo en todas las instancias
- Verifica que los usuarios existan en `auth.users` o en `teachers`

