import 'dotenv/config';
import { supabase } from '../src/db.js';

async function checkUser() {
    try {
        console.log('🔍 Verificando usuario en Supabase...\n');

        // Buscar usuario
        const { data: teacher, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('email', 'admin@ejemplo.com')
            .single();

        if (error) {
            console.error('❌ Error al buscar usuario:', error);
            process.exit(1);
        }

        if (!teacher) {
            console.log('❌ Usuario no encontrado');
            process.exit(1);
        }

        console.log('✅ Usuario encontrado:');
        console.log('   Email:', teacher.email);
        console.log('   Nombre:', teacher.first_name, teacher.last_name);
        console.log('   Activo:', teacher.is_active);
        console.log('   Tiene contraseña:', teacher.contraseña ? 'Sí' : 'No');
        console.log('   Tipo contraseña:', teacher.contraseña?.substring(0, 4));

        // Verificar rol
        const { data: role } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', teacher.user_id || teacher.id)
            .single();

        console.log('   Rol:', role?.role || 'Sin rol asignado');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

checkUser();
