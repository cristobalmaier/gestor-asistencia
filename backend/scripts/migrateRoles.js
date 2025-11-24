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

async function migrateToUsuariosRoles() {
    console.log('========== MIGRANDO A USUARIOS_ROLES ==========\n');

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
        // Verificar si ya tiene rol en usuarios_roles
        const { data: existingRole } = await supabase
            .from('usuarios_roles')
            .select('rol')
            .eq('user_id', teacher.user_id)
            .maybeSingle();

        let rolCorrecto = 'profesor'; // Por defecto
        if (teacher.email.includes('admin')) rolCorrecto = 'admin';

        console.log(`${teacher.first_name} ${teacher.last_name} (${teacher.email})`);

        if (existingRole) {
            console.log(`  ✅ Ya tiene rol: ${existingRole.rol}`);
        } else {
            console.log(`  Insertando rol: ${rolCorrecto}`);

            const { error: insertError } = await supabase
                .from('usuarios_roles')
                .insert({
                    user_id: teacher.user_id,
                    rol: rolCorrecto
                });

            if (insertError) {
                console.log(`  ⚠️ Error: ${insertError.message}`);
            } else {
                console.log(`  ✅ Rol insertado correctamente`);
            }
        }
    }

    console.log('\n========== PROBANDO ENUM TIPO_EVENTO ==========\n');

    // Obtener un teacher con user_id para crear eventos de prueba
    const testTeacher = teachers.find(t => t.user_id);
    if (!testTeacher) {
        console.log('No hay teachers con user_id para probar');
        return;
    }

    const testUserId = testTeacher.user_id;
    console.log(`Usando user_id: ${testUserId}\n`);

    // Probar diferentes valores de tipo_evento
    const tiposToTest = ['general', 'General', 'GENERAL', 'evaluacion', 'Evaluacion', 'EVALUACION', 'feriado', 'acto', 'reunion', 'otro'];

    for (const tipo of tiposToTest) {
        const { error } = await supabase
            .from('eventos')
            .insert({
                titulo: `Test ${tipo}`,
                descripcion: 'Testing enum',
                fecha_inicio: new Date().toISOString(),
                tipo_evento: tipo,
                created_by: testUserId
            })
            .select();

        if (error) {
            console.log(`  ❌ "${tipo}": ${error.message}`);
        } else {
            console.log(`  ✅ "${tipo}": VÁLIDO`);
            // Limpiar
            await supabase.from('eventos').delete().eq('titulo', `Test ${tipo}`);
        }
    }
}

migrateToUsuariosRoles();
