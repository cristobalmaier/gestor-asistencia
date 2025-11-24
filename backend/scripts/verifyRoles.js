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

async function checkRoles() {
    console.log('========== VERIFICANDO ROLES EN USUARIOS_ROLES ==========\n');

    // Obtener todos los usuarios_roles
    const { data: roles, error } = await supabase
        .from('usuarios_roles')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total de roles: ${roles.length}\n`);

    for (const role of roles) {
        // Buscar el teacher correspondiente
        const { data: teacher } = await supabase
            .from('teachers')
            .select('first_name, last_name, email')
            .eq('user_id', role.user_id)
            .maybeSingle();

        if (teacher) {
            console.log(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
            console.log(`  user_id: ${role.user_id}`);
            console.log(`  rol: ${role.rol}`);
            console.log('');
        } else {
            console.log(`user_id: ${role.user_id}`);
            console.log(`  rol: ${role.rol}`);
            console.log(`  ⚠️ No se encontró teacher con este user_id`);
            console.log('');
        }
    }
}

checkRoles();
