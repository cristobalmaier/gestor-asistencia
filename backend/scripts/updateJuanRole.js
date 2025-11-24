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

async function updateJuanRole() {
    console.log('========== ACTUALIZANDO ROL DE JUAN PÉREZ ==========\n');

    // Buscar Juan Pérez
    const { data: juan } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', 'profesor@ejemplo.com')
        .single();

    if (!juan) {
        console.log('No se encontró Juan Pérez');
        return;
    }

    console.log(`Encontrado: ${juan.first_name} ${juan.last_name}`);
    console.log(`user_id: ${juan.user_id}`);

    if (!juan.user_id) {
        console.log('⚠️ No tiene user_id, no se puede actualizar rol');
        return;
    }

    // Verificar rol actual
    const { data: currentRole } = await supabase
        .from('usuarios_roles')
        .select('rol')
        .eq('user_id', juan.user_id)
        .maybeSingle();

    console.log(`Rol actual: ${currentRole?.rol || 'ninguno'}`);

    // Si el rol es "teacher", actualizarlo a "profesor"
    if (currentRole?.rol === 'teacher') {
        console.log('\nActualizando de "teacher" a "profesor"...');

        const { error } = await supabase
            .from('usuarios_roles')
            .update({ rol: 'profesor' })
            .eq('user_id', juan.user_id);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('✅ Rol actualizado correctamente');
        }
    } else {
        console.log('\n✅ El rol ya es correcto');
    }
}

updateJuanRole();
