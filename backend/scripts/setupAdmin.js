import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupAdmin() {
  try {
    const adminEmail = 'admin@ejemplo.com';
    const adminPassword = 'Admin123!';
    const adminId = '425878f2-1317-4028-a167-10acb21386ab';
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Datos del administrador en public.users
    const adminData = {
      id: adminId,
      email: adminEmail,
      contraseña: hashedPassword,
      nombre: 'Admin',
      apellido: 'Sistema',
      rol: 'admin',
      full_name: 'Admin Sistema',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Verificar si el admin ya existe
    const { data: existingAdmin, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existingAdmin) {
      // Actualizar admin existente
      const { data: updatedAdmin, error: updateError } = await supabase
        .from('users')
        .update({
          contraseña: hashedPassword,
          nombre: 'Admin',
          apellido: 'Sistema',
          rol: 'admin',
          full_name: 'Admin Sistema',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAdmin.id)
        .select()
        .single();

      if (updateError) throw updateError;
      console.log('✅ Usuario administrador actualizado:', updatedAdmin.email);
    } else {
      // Crear nuevo admin
      const { data: newAdmin, error: createError } = await supabase
        .from('users')
        .insert(adminData)
        .select()
        .single();

      if (createError) throw createError;
      console.log('✅ Nuevo usuario administrador creado:', newAdmin.email);
    }

    // Asignar rol de administrador en usuarios_roles
    const { error: roleError } = await supabase
      .from('usuarios_roles')
      .upsert({
        user_id: adminId,
        rol: 'admin',
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (roleError) {
      console.error('❌ Error al asignar rol de administrador:', roleError);
      throw roleError;
    }
    
    console.log('✅ Rol de administrador asignado correctamente');
    console.log('\n🔑 Credenciales de acceso:');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔐 Contraseña: ${adminPassword}`);
    console.log('\n⚠️ ¡Asegúrate de cambiar esta contraseña después del primer inicio de sesión!');

  } catch (error) {
    console.error('❌ Error al configurar el usuario administrador:');
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Ejecutar el script
setupAdmin();
