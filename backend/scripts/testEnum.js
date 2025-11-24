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

async function testEnum() {
    console.log('Fetching a valid user...');
    const { data: user } = await supabase.from('teachers').select('id, user_id').limit(1).single();

    if (!user) {
        console.error('No users found to test with');
        return;
    }

    const userId = user.user_id || user.id;
    console.log('Using user ID:', userId);

    console.log('Testing insertion with capitalized enum value "General"...');

    const { data, error } = await supabase
        .from('eventos')
        .insert({
            titulo: 'Test Enum',
            descripcion: 'Testing enum value',
            fecha_inicio: new Date().toISOString(),
            tipo_evento: 'General',
            created_by: userId
        })
        .select();

    if (error) {
        console.error('Error with "General":', error.message);

        console.log('Testing with "GENERAL" (uppercase)...');
        const { data: data2, error: error2 } = await supabase
            .from('eventos')
            .insert({
                titulo: 'Test Enum 2',
                descripcion: 'Testing enum value',
                fecha_inicio: new Date().toISOString(),
                tipo_evento: 'GENERAL',
                created_by: userId
            })
            .select();

        if (error2) {
            console.error('Error with "GENERAL":', error2.message);
        } else {
            console.log('Success with "GENERAL"!');
            await supabase.from('eventos').delete().eq('id', data2[0].id);
        }
    } else {
        console.log('Success with "General"!');
        await supabase.from('eventos').delete().eq('id', data[0].id);
    }
}

testEnum();
