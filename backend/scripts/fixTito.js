import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTitoRole() {
    console.log('========== ARREGLANDO TITO CALDERON ==========\n');

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
    console.log(`teacher.user_id: ${tito.user_id}`);
    console.log('');

    if (tito.user_id) {
        console.log('✅ Ya tiene user_id, solo actualizando rol...');

        // Actualizar o insertar rol
        const { error } = await supabase
            .from('usuarios_roles')
            .upsert({
                user_id: tito.user_id,
                rol: 'preceptor'
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Error al actualizar rol:', error);
        } else {
            console.log('✅ Rol actualizado a "preceptor"');
        }
        return;
    }

    console.log('⚠️ No tiene user_id, creando usuario en Supabase Auth...\n');

    // Crear usuario en Supabase Auth
    const tempPassword = 'Preceptor123!'; // Contraseña temporal

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: tito.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            first_name: tito.first_name,
            last_name: tito.last_name
        }
    });

    if (authError) {
        console.error('❌ Error al crear usuario en auth:', authError);
        return;
    }

    console.log(`✅ Usuario auth creado: ${authUser.user.id}`);
    console.log(`   Contraseña temporal: ${tempPassword}\n`);

    // Actualizar teacher con user_id
    const { error: updateError } = await supabase
        .from('teachers')
        .update({
            user_id: authUser.user.id,
            contraseña: await bcrypt.hash(tempPassword, 10)
        })
        .eq('id', tito.id);

    if (updateError) {
        console.error('❌ Error al actualizar teacher:', updateError);
        return;
    }

    console.log('✅ Teacher actualizado con user_id');

    // Crear rol en usuarios_roles
    const { error: roleError } = await supabase
        .from('usuarios_roles')
        .insert({
            user_id: authUser.user.id,
            rol: 'preceptor'
        });

    if (roleError) {
        console.error('❌ Error al crear rol:', roleError);
    } else {
        console.log('✅ Rol "preceptor" asignado correctamente');
    }

    console.log('\n========== RESUMEN ==========');
    console.log(`Email: ${tito.email}`);
    console.log(`Contraseña temporal: ${tempPassword}`);
    console.log(`Rol: preceptor`);
    console.log('\n⚠️ IMPORTANTE: Cambia la contraseña después del primer login');
}

fixTitoRole();
