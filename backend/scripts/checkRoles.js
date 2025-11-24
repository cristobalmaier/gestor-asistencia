import { supabase } from '../src/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkRoles() {
    console.log('===== VERIFICANDO ROLES EN USER_ROLES =====\n');

    // Obtener todos los teachers con sus roles
    const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('id, user_id, first_name, last_name, email');

    if (teachersError) {
        console.error('Error al obtener teachers:', teachersError);
        return;
    }

    console.log(`Found ${teachers.length} teachers\n`);

    // Para cada teacher, buscar su rol
    for (const teacher of teachers) {
        const { data: role, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', teacher.id)
            .single();

        console.log(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
        console.log(`  - teacher.id: ${teacher.id}`);
        console.log(`  - teacher.user_id: ${teacher.user_id}`);

        if (roleError) {
            console.log(`  - Rol en user_roles: ❌ NO ENCONTRADO (${roleError.message})`);
        } else {
            console.log(`  - Rol en user_roles: ✅ ${role.role}`);
        }
        console.log('');
    }

    console.log('\n===== VERIFICANDO ENUMS PERMITIDOS =====\n');

    // Intentar obtener información sobre el enum tipo_evento
    const { data: eventos } = await supabase
        .from('eventos')
        .select('tipo_evento')
        .limit(5);

    if (eventos && eventos.length > 0) {
        console.log('Valores existentes de tipo_evento en la BD:');
        eventos.forEach(e => console.log(`  - "${e.tipo_evento}"`));
    }
}

checkRoles();
