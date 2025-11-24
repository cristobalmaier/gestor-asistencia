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

async function fixUserRoles() {
    console.log('========== ARREGLANDO ROLES ==========\n');

    // Obtener todos los teachers con user_id válido
    const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('id, user_id, first_name, last_name, email')
        .not('user_id', 'is', null);

    if (teachersError) {
        console.error('Error:', teachersError);
        return;
    }

    console.log(`Encontrados ${teachers.length} usuarios con user_id válido\n`);

    for (const teacher of teachers) {
        // Verificar si ya tiene rol
        const { data: existingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', teacher.user_id) // Usar user_id, no id!
            .maybeSingle();

        let rolCorrecto = 'teacher'; // Por defecto
        if (teacher.email.includes('admin')) rolCorrecto = 'admin';

        console.log(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
        console.log(`  user_id: ${teacher.user_id}`);

        if (existingRole) {
            console.log(`  Ya tiene rol: ${existingRole.role}`);

            // Actualizar si es incorrecto
            if (existingRole.role !== rolCorrecto) {
                const { error: updateError } = await supabase
                    .from('user_roles')
                    .update({ role: rolCorrecto })
                    .eq('user_id', teacher.user_id);

                if (updateError) {
                    console.log(`  ⚠️ Error al actualizar: ${updateError.message}`);
                } else {
                    console.log(`  ✅ Actualizado a: ${rolCorrecto}`);
                }
            }
        } else {
            console.log(`  Insertando rol: ${rolCorrecto}`);

            const { error: insertError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: teacher.user_id, // Usar user_id!
                    role: rolCorrecto
                });

            if (insertError) {
                console.log(`  ⚠️ Error: ${insertError.message}`);
            } else {
                console.log(`  ✅ Rol insertado correctamente`);
            }
        }
        console.log('');
    }
}

fixUserRoles();
