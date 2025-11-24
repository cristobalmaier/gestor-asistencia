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

async function checkAndFixRoles() {
    console.log('========== VERIFICANDO Y ARREGLANDO ROLES ==========\n');

    // Obtener todos los teachers
    const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('id, user_id, first_name, last_name, email');

    if (teachersError) {
        console.error('Error al obtener teachers:', teachersError);
        return;
    }

    console.log(`Encontrados ${teachers.length} usuarios\n`);

    // Para cada teacher, verificar y arreglar su rol
    for (const teacher of teachers) {
        const { data: role, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', teacher.id)
            .maybeSingle();

        console.log(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);

        if (!role) {
            console.log(`  ❌ Sin rol en user_roles`);

            // Determinar el rol correcto según el email
            let rolCorrecto = 'profesor';
            if (teacher.email.includes('admin')) rolCorrecto = 'admin';
            else if (teacher.email.includes('preceptor')) rolCorrecto = 'preceptor';
            else if (teacher.email.includes('profesor')) rolCorrecto = 'profesor';

            console.log(`  ✅ Asignando rol: ${rolCorrecto}`);

            // Insertar el rol
            const { error: insertError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: teacher.id,
                    role: rolCorrecto
                });

            if (insertError) {
                console.log(`  ⚠️ Error al insertar: ${insertError.message}`);
            } else {
                console.log(`  ✅ Rol insertado correctamente`);
            }
        } else {
            console.log(`  ✅ Ya tiene rol: ${role.role}`);
        }
        console.log('');
    }

    console.log('\n========== VERIFICANDO TIPO_EVENTO ENUM ==========\n');

    // Obtener eventos existentes
    const { data: eventos } = await supabase
        .from('eventos')
        .select('tipo_evento')
        .limit(10);

    if (eventos && eventos.length > 0) {
        console.log('Valores de tipo_evento en la base de datos:');
        const unique = [...new Set(eventos.map(e => e.tipo_evento))];
        unique.forEach(tipo => console.log(`  - "${tipo}"`));
    } else {
        console.log('No hay eventos en la base de datos');
    }
}

checkAndFixRoles();
