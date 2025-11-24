import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function queryEnums() {
    console.log('========== CONSULTANDO ENUMS EN SUPABASE ==========\n');

    // Intentar obtener información del schema
    const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .limit(5);

    console.log('Estructura de user_roles:');
    if (roles && roles.length > 0) {
        console.log('Columnas:', Object.keys(roles[0]));
        console.log('Ejemplos:');
        roles.forEach(r => console.log(`  - user_id: ${r.user_id}, role: ${r.role}`));
    } else {
        console.log('  (Sin datos o error:', error?.message, ')');
    }

    console.log('\n========== CONSULTANDO TEACHERS ==========\n');
    const { data: teachers } = await supabase
        .from('teachers')
        .select('id, user_id')
        .limit(3);

    if (teachers) {
        console.log('IDs de teachers:');
        teachers.forEach(t => console.log(`  - id: ${t.id}, user_id: ${t.user_id}`));
    }

    console.log('\n========== INTENTANDO INSERTAR ROLES VÁLIDOS ==========\n');

    // Probar diferentes valores de rol
    const rolesToTest = ['admin', 'teacher', 'profesor', 'preceptor', 'directivo', 'alumno', 'padre'];

    for (const rol of rolesToTest) {
        // Usar el primer teacher para probar
        if (!teachers || teachers.length === 0) continue;

        const testUserId = teachers[0].id;

        // Primero eliminar cualquier rol existente para este test
        await supabase.from('user_roles').delete().eq('user_id', testUserId);

        const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
                user_id: testUserId,
                role: rol
            });

        if (insertError) {
            console.log(`  ❌ "${rol}": ${insertError.message}`);
        } else {
            console.log(`  ✅ "${rol}": VÁLIDO`);
            // Limpiar después del test exitoso
            await supabase.from('user_roles').delete().eq('user_id', testUserId);
        }
    }
}

queryEnums();
