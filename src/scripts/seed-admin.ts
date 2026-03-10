// ============================================================
// Seed Script — Buat Akun Super Admin
// Jalankan: npx tsx src/scripts/seed-admin.ts
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset di .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ---- Konfigurasi akun admin ----
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_FULLNAME = 'Super Admin';

async function seedAdmin() {
    console.log('🔧 Membuat akun Super Admin...\n');

    // 1. Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_FULLNAME },
    });

    if (authError) {
        if (authError.message.includes('already')) {
            console.log('⚠️  User sudah ada di Auth. Mencoba update role di metadata...\n');

            // Ambil user dari Auth berdasarkan email
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

            if (existingUser) {
                // Update role di users_metadata
                const { error: updateError } = await supabase
                    .from('users_metadata')
                    .update({ role: 'admin' })
                    .eq('auth_id', existingUser.id);

                if (updateError) {
                    console.error('❌ Gagal update role:', updateError.message);
                    process.exit(1);
                }

                console.log('✅ Role berhasil diupdate ke "admin"!');
                console.log(`   Email    : ${ADMIN_EMAIL}`);
                console.log(`   Password : ${ADMIN_PASSWORD}`);
                console.log(`   Role     : admin`);
                process.exit(0);
            }

            console.error('❌ User tidak ditemukan di daftar Auth.');
            process.exit(1);
        }

        console.error('❌ Gagal membuat user:', authError.message);
        process.exit(1);
    }

    if (!authData.user) {
        console.error('❌ User tidak tercipta.');
        process.exit(1);
    }

    console.log(`✅ User Auth berhasil dibuat: ${authData.user.id}\n`);

    // 2. Simpan metadata dengan role admin
    const initials = ADMIN_FULLNAME.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const { error: metaError } = await supabase.from('users_metadata').insert({
        auth_id: authData.user.id,
        role: 'admin',
        full_name: ADMIN_FULLNAME,
        initials,
        email: ADMIN_EMAIL,
        phone: null,
        bio: 'Super Administrator SIAGA',
        district: '',
        city: '',
        province: '',
        eco_points: 0,
        current_badge: 'Administrator',
        total_reports: 0,
        total_actions: 0,
        rank: 0,
    });

    if (metaError) {
        console.error('❌ Gagal menyimpan metadata:', metaError.message);
        process.exit(1);
    }

    console.log('✅ Akun Super Admin berhasil dibuat!\n');
    console.log('   ┌────────────────────────────────┐');
    console.log(`   │  Email    : ${ADMIN_EMAIL.padEnd(18)} │`);
    console.log(`   │  Password : ${ADMIN_PASSWORD.padEnd(18)} │`);
    console.log('   │  Role     : admin              │');
    console.log('   └────────────────────────────────┘\n');
}

seedAdmin().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
