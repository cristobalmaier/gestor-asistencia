# Guía de Migración - Agregar Campo "Tarde"

## Objetivo
Agregar soporte para el estado "Tarde" en el sistema de asistencias.

## Pasos para Ejecutar la Migración en Supabase

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. **Accede a tu proyecto en Supabase**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Copia y pega el contenido del archivo**
   - Abre el archivo `migration_add_tarde_field.sql`
   - Copia todo el contenido
   - Pégalo en el editor SQL de Supabase

4. **Ejecuta la migración**
   - Haz clic en el botón "Run" o presiona `Ctrl + Enter`
   - Verifica que no haya errores en la consola

5. **Verifica la migración**
   - En el menú lateral, ve a "Table Editor"
   - Selecciona la tabla `asistencias`
   - Verifica que aparezca la nueva columna `tarde` (boolean)

### Opción 2: Usando la CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db push

# O ejecuta directamente el archivo SQL
psql -h <tu-host> -U postgres -d postgres -f bd/migration_add_tarde_field.sql
```

## Verificación Post-Migración

Ejecuta esta consulta en el SQL Editor para verificar:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'asistencias' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

Deberías ver la columna `tarde` con:
- **data_type**: boolean
- **column_default**: false
- **is_nullable**: YES

## Rollback (Si es necesario)

Si necesitas revertir la migración:

```sql
-- Eliminar índices
DROP INDEX IF EXISTS public.idx_asistencias_tarde;
DROP INDEX IF EXISTS public.idx_asistencias_fecha_materia;

-- Eliminar columna
ALTER TABLE public.asistencias DROP COLUMN IF EXISTS tarde;
```

## Próximos Pasos

Después de ejecutar la migración:
1. ✅ El backend ya está actualizado para usar el nuevo campo
2. ✅ El frontend ya soporta el estado "Tarde"
3. ✅ Reinicia el servidor backend para aplicar los cambios
4. ✅ Prueba el sistema de asistencias

## Soporte

Si encuentras algún problema durante la migración, verifica:
- Que tengas permisos de administrador en Supabase
- Que la tabla `asistencias` exista
- Que no haya registros bloqueados en la tabla
