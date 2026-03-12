// ============================================================
// Fix Script — Perbaiki role admin & pemerintah yang belum di-set
// Jalankan: npx tsx fix-roles.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function fix() {
    console.log('🔧 Memperbaiki role akun admin & pemerintah...\n');

    // Fix admin role
    const { data: adminData, error: adminError } = await supabase
        .from('users_metadata')
        .update({ role: 'admin' })
        .eq('email', 'admin@siaga.id')
        .select('email, role');

    if (adminError) {
        console.error('❌ Gagal update role admin:', adminError.message);
    } else if (adminData && adminData.length > 0) {
        console.log('✅ Role admin berhasil diupdate:', adminData[0].email, '→', adminData[0].role);
    } else {
        console.log('⚠️  Akun admin@siaga.id tidak ditemukan di users_metadata.');
    }

    // Fix pemerintah role
    const { data: govData, error: govError } = await supabase
        .from('users_metadata')
        .update({ role: 'pemerintah' })
        .eq('email', 'gov@siaga.id')
        .select('email, role');

    if (govError) {
        console.error('❌ Gagal update role pemerintah:', govError.message);
    } else if (govData && govData.length > 0) {
        console.log('✅ Role pemerintah berhasil diupdate:', govData[0].email, '→', govData[0].role);
    } else {
        console.log('⚠️  Akun gov@siaga.id tidak ditemukan di users_metadata.');
    }

    console.log('\n🎉 Selesai!');
}

fix().catch(console.error);
