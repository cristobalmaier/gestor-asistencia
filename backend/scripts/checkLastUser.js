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

async function checkLastUser() {
    console.log('========== VERIFICANDO ÚLTIMO USUARIO CREADO ==========\n');

    // Obtener el último teacher creado
    const { data: teachers, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    for (const teacher of teachers) {
        console.log(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
        console.log(`  teacher.id: ${teacher.id}`);
        console.log(`  teacher.user_id: ${teacher.user_id}`);

        if (teacher.user_id) {
            // Buscar rol en usuarios_roles
            const { data: role } = await supabase
                .from('usuarios_roles')
                .select('rol')
                .eq('user_id', teacher.user_id)
                .maybeSingle();

            if (role) {
                console.log(`  ✅ Rol en usuarios_roles: ${role.rol}`);
            } else {
                console.log(`  ❌ No tiene rol en usuarios_roles`);
            }
        } else {
            console.log(`  ⚠️ No tiene user_id (usuario antiguo sin migrar)`);
        }
        console.log('');
    }
}

checkLastUser();
