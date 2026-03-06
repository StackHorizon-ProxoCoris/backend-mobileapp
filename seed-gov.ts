// ============================================================
// Seed Script — Buat Akun Pemerintah
// Jalankan: npx ts-node seed-gov.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// Data Akun Pemerintah yang akan dibuat
// ============================================================
const GOV_ACCOUNT = {
    email: 'gov@siaga.id',
    password: 'Gov@Siaga2026',
    fullName: 'Dinas Pemerintah Kota',
    phone: '0811000001',
    district: 'Coblong',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
};

async function seed() {
    console.log('🌱 Memulai seed akun pemerintah...');
    console.log(`📧 Email   : ${GOV_ACCOUNT.email}`);
    console.log(`🔑 Password: ${GOV_ACCOUNT.password}`);
    console.log('');

    // 1. Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: GOV_ACCOUNT.email,
        password: GOV_ACCOUNT.password,
        email_confirm: true,
        user_metadata: {
            full_name: GOV_ACCOUNT.fullName,
            phone: GOV_ACCOUNT.phone,
        },
    });

    if (authError) {
        if (authError.message.includes('already')) {
            console.log('⚠️  Akun dengan email ini sudah ada di Supabase Auth.');
            console.log('   Silakan login langsung dengan kredensial di atas.');
        } else {
            console.error('❌ Gagal membuat auth user:', authError.message);
        }
        return;
    }

    if (!authData.user) {
        console.error('❌ authData.user kosong.');
        return;
    }

    console.log('✅ Auth user berhasil dibuat:', authData.user.id);

    // 2. Buat metadata di users_metadata
    const initials = GOV_ACCOUNT.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const { error: metaError } = await supabase.from('users_metadata').insert({
        auth_id: authData.user.id,
        full_name: GOV_ACCOUNT.fullName,
        initials,
        email: GOV_ACCOUNT.email,
        phone: GOV_ACCOUNT.phone,
        bio: 'Akun resmi instansi pemerintah daerah.',
        district: GOV_ACCOUNT.district,
        city: GOV_ACCOUNT.city,
        province: GOV_ACCOUNT.province,
        eco_points: 0,
        current_badge: 'Pejabat',
        total_reports: 0,
        total_actions: 0,
        rank: 0,
    });

    if (metaError) {
        console.warn('⚠️  Gagal insert users_metadata:', metaError.message);
        console.log('   Akun auth tetap terbuat, tapi profil kosong.');
    } else {
        console.log('✅ Metadata users_metadata berhasil disimpan.');
    }

    console.log('');
    console.log('🎉 Selesai! Gunakan kredensial berikut untuk login:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email    : ${GOV_ACCOUNT.email}`);
    console.log(`   Password : ${GOV_ACCOUNT.password}`);
    console.log(`   Role     : Pemerintah (pilih di halaman login)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(console.error);
