import 'dotenv/config';
import { supabase } from '../src/db.js';
import bcrypt from 'bcryptjs';

async function testLogin() {
    try {
        const email = 'admin@ejemplo.com';
        const password = 'Admin123!';

        console.log('🔐 Probando login...\n');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('');

        // 1. Buscar usuario
        console.log('1️⃣ Buscando usuario en teachers...');
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('*')
            .eq('email', email)
            .single();

        if (teacherError) {
            console.error('❌ Error al buscar usuario:', teacherError);
            process.exit(1);
        }

        if (!teacher) {
            console.error('❌ Usuario no encontrado');
            process.exit(1);
        }

        console.log('✅ Usuario encontrado:', teacher.email);
        console.log('');

        // 2. Verificar activo
        console.log('2️⃣ Verificando estado activo...');
        if (!teacher.is_active) {
            console.error('❌ Usuario inactivo');
            process.exit(1);
        }
        console.log('✅ Usuario activo');
        console.log('');

        // 3. Verificar contraseña
        console.log('3️⃣ Verificando contraseña...');
        console.log('Contraseña almacenada (primeros 20 chars):', teacher.contraseña?.substring(0, 20));

        let passwordMatch = false;

        // Intentar con bcrypt
        if (teacher.contraseña && (teacher.contraseña.startsWith('$2a$') || teacher.contraseña.startsWith('$2b$'))) {
            console.log('Tipo: Bcrypt hash detectado');
            try {
                passwordMatch = await bcrypt.compare(password, teacher.contraseña);
                console.log('Resultado bcrypt.compare:', passwordMatch);
            } catch (error) {
                console.error('Error en bcrypt.compare:', error);
            }
        }

        // Intentar comparación directa
        if (!passwordMatch && teacher.contraseña === password) {
            console.log('Tipo: Texto plano coincide');
            passwordMatch = true;
        }

        if (!passwordMatch) {
            console.error('❌ Contraseña incorrecta');
            console.log('\n🔍 Debug info:');
            console.log('Password ingresado:', password);
            console.log('Password en DB (hash):', teacher.contraseña?.substring(0, 30) + '...');
            process.exit(1);
        }

        console.log('✅ Contraseña correcta');
        console.log('');

        // 4. Verificar rol
        console.log('4️⃣ Verificando rol...');
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', teacher.user_id || teacher.id)
            .single();

        const role = userRole?.role || 'teacher';
        console.log('✅ Rol:', role);
        console.log('');

        console.log('🎉 LOGIN EXITOSO');
        console.log('\nDatos del usuario:');
        console.log('  ID:', teacher.id);
        console.log('  Email:', teacher.email);
        console.log('  Nombre:', teacher.first_name, teacher.last_name);
        console.log('  Rol:', role);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error general:', err);
        process.exit(1);
    }
}

testLogin();
