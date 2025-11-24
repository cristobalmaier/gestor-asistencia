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

async function deleteTito() {
    console.log('========== ELIMINANDO TITO CALDERON ==========\n');

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
    console.log(`Eliminando...\n`);

    const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', tito.id);

    if (error) {
        console.error('Error al eliminar:', error);
    } else {
        console.log('✅ Tito Calderon eliminado correctamente');
        console.log('\nAhora puedes crear un nuevo usuario "Tito Calderon" desde el frontend');
        console.log('con el rol "preceptor" y funcionará correctamente.');
    }
}

deleteTito();
