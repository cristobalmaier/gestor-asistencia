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

async function fixTitoSimple() {
    console.log('========== ARREGLANDO TITO CALDERON (MÉTODO SIMPLE) ==========\n');

    // Buscar Tito
    const { data: tito } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', 'titocalderon@gmail.com')
        .single();

    if (!tito) {
        console.log('❌ No se encontró Tito Calderon');
        return;
    }

    console.log(`Encontrado: ${tito.first_name} ${tito.last_name}`);
    console.log(`teacher.id: ${tito.id}`);
    console.log(`teacher.user_id: ${tito.user_id}\n`);

    // Buscar si existe un usuario en auth.users con este email
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error al listar usuarios:', listError);
        return;
    }

    const existingAuthUser = authUsers.users.find(u => u.email === tito.email);

    if (existingAuthUser) {
        console.log(`✅ Usuario auth encontrado: ${existingAuthUser.id}\n`);

        // Actualizar teacher con este user_id
        const { error: updateError } = await supabase
            .from('teachers')
            .update({ user_id: existingAuthUser.id })
            .eq('id', tito.id);

        if (updateError) {
            console.error('Error al actualizar teacher:', updateError);
            return;
        }

        console.log('✅ Teacher actualizado con user_id');

        // Crear/actualizar rol en usuarios_roles
        const { error: roleError } = await supabase
            .from('usuarios_roles')
            .upsert({
                user_id: existingAuthUser.id,
                rol: 'preceptor'
            }, {
                onConflict: 'user_id'
            });

        if (roleError) {
            console.error('Error al actualizar rol:', roleError);
        } else {
            console.log('✅ Rol "preceptor" asignado correctamente');
        }
    } else {
        console.log('⚠️ No existe usuario auth con este email');
        console.log('Solución: Elimina a Tito y créalo de nuevo desde el frontend');
    }
}

fixTitoSimple();
