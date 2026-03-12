// ============================================================
// Seed Script — Buat Akun Admin
// Jalankan: npx tsx seed-admin.ts
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
// Data Akun Admin yang akan dibuat
// ============================================================
const ADMIN_ACCOUNT = {
    email: 'admin@siaga.id',
    password: 'Admin@Siaga2026',
    fullName: 'Super Administrator',
    phone: '0811000000',
    district: 'Pusat',
    city: 'Kota Bandung',
    province: 'Jawa Barat',
};

async function seed() {
    console.log('🌱 Memulai seed akun admin...');
    console.log(`📧 Email   : ${ADMIN_ACCOUNT.email}`);
    console.log(`🔑 Password: ${ADMIN_ACCOUNT.password}`);
    console.log('');

    // 1. Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_ACCOUNT.email,
        password: ADMIN_ACCOUNT.password,
        email_confirm: true,
        user_metadata: {
            full_name: ADMIN_ACCOUNT.fullName,
            phone: ADMIN_ACCOUNT.phone,
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
    const initials = ADMIN_ACCOUNT.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const { error: metaError } = await supabase.from('users_metadata').insert({
        auth_id: authData.user.id,
        role: 'admin',
        full_name: ADMIN_ACCOUNT.fullName,
        initials,
        email: ADMIN_ACCOUNT.email,
        phone: ADMIN_ACCOUNT.phone,
        bio: 'Akun administrator sistem SIAGA.',
        district: ADMIN_ACCOUNT.district,
        city: ADMIN_ACCOUNT.city,
        province: ADMIN_ACCOUNT.province,
        eco_points: 0,
        current_badge: 'Administrator',
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
    console.log(`   Email    : ${ADMIN_ACCOUNT.email}`);
    console.log(`   Password : ${ADMIN_ACCOUNT.password}`);
    console.log(`   Role     : Admin (pilih tab Admin di halaman login)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(console.error);
