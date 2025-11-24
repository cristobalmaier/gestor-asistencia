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

async function seedAdmin() {
  try {
    const adminEmail = 'admin@ejemplo.com';
    const adminPassword = 'Admin123!'; // Contraseña segura para el admin
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Verificar si el admin ya existe
    const { data: existingAdmin, error: findError } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no se encontraron resultados
      throw findError;
    }

    let userId = '425878f2-1317-4028-a167-10acb21386ab';
    
    // Intentar iniciar sesión primero para ver si el usuario ya existe
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    if (signInError) {
      // Si no existe, crear el usuario
      if (signInError.status === 400) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            data: {
              first_name: 'Admin',
              last_name: 'Sistema',
    const adminData = {
      id: adminId,
      user_id: adminId,
      first_name: 'Admin',
      last_name: 'Sistema',
      email: adminEmail,
      dni: '87654321',
      phone: '+5491188776655',
      employment_status: 'titular',
      is_active: true,
      contraseña: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: adminId
    };

    if (existingAdmin) {
      // Actualizar admin existente
      const { data: updatedAdmin, error: updateError } = await supabase
        .from('teachers')
        .update({
          ...adminData,
          id: existingAdmin.id, // Mantener el ID existente
          user_id: existingAdmin.user_id || existingAdmin.id
        })
        .eq('id', existingAdmin.id)
        .select()
        .single();

      if (updateError) throw updateError;
      console.log('Usuario administrador actualizado:', updatedAdmin.email);
    } else {
      // Crear nuevo admin
      const { data: newAdmin, error: createError } = await supabase
        .from('teachers')
        .insert(adminData)
        .select()
        .single();

      if (createError) throw createError;
      console.log('Nuevo usuario administrador creado:', newAdmin.email);
    }

    // Asignar rol de administrador
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: adminId,
        role: 'admin',
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (roleError) {
      console.error('Error al asignar rol de administrador:', roleError);
      throw roleError;
    }
    
    console.log('Rol de administrador asignado correctamente');

    console.log('\n✅ Inicialización completada exitosamente');
    console.log(`🔑 Credenciales de acceso:`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔐 Contraseña: ${adminPassword}`);
    console.log('\n⚠️ ¡Asegúrate de cambiar esta contraseña después del primer inicio de sesión!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar el usuario administrador:');
    console.error(error);
    process.exit(1);
  }
}

seedAdmin();
