-- ============================================================
-- Migration 008: Create budget tables
-- Data anggaran proyek pemerintah dan serapan per dinas
-- ============================================================

-- Tabel proyek anggaran
CREATE TABLE IF NOT EXISTS budget_projects (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    org VARCHAR(100) NOT NULL,
    kec VARCHAR(100) NOT NULL,
    icon VARCHAR(30) DEFAULT 'Briefcase',
    icon_color VARCHAR(10) DEFAULT '#7c3aed',
    bg_color VARCHAR(10) DEFAULT '#f5f3ff',
    status VARCHAR(20) NOT NULL DEFAULT 'Normal',
    budget BIGINT NOT NULL DEFAULT 0,
    realisasi INTEGER NOT NULL DEFAULT 0,
    fisik INTEGER NOT NULL DEFAULT 0,
    deadline VARCHAR(30),
    anomali_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel serapan per dinas
CREATE TABLE IF NOT EXISTS budget_dinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    short VARCHAR(10) NOT NULL,
    budget VARCHAR(20) NOT NULL,
    serap INTEGER NOT NULL DEFAULT 0,
    color VARCHAR(10) DEFAULT '#3b82f6',
    bg VARCHAR(10) DEFAULT '#eff6ff',
    status VARCHAR(20) NOT NULL DEFAULT 'Normal',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data proyek
INSERT INTO budget_projects (id, title, org, kec, icon, icon_color, bg_color, status, budget, realisasi, fisik, deadline, anomali_note) VALUES
    ('P-001', 'Perbaikan Jl. Merdeka & Jl. Braga', 'Dinas PU', 'Kec. Coblong', 'RoadHorizon', '#3b82f6', '#eff6ff', 'Anomali', 850000000, 95, 80, 'Mar 2026', 'Gap realisasi vs fisik: 15%'),
    ('P-002', 'Penataan Taman Kota Selatan', 'Dinas LH', 'Kec. Bandung Wetan', 'Tree', '#059669', '#ecfdf5', 'Normal', 1200000000, 58, 55, 'Jun 2026', NULL),
    ('P-003', 'Pembangunan Sarana Air Bersih', 'Dinas PU', 'Kec. Cibeunying', 'Drop', '#0ea5e9', '#f0f9ff', 'Anomali', 2100000000, 88, 60, 'Apr 2026', 'Gap realisasi vs fisik: 28%'),
    ('P-004', 'Pengadaan Alat Kesehatan Puskesmas', 'Dinas Kesehatan', 'Kota Bandung', 'Heartbeat', '#ec4899', '#fdf2f8', 'Normal', 1750000000, 72, 70, 'Mei 2026', NULL),
    ('P-005', 'Digitalisasi Pelayanan Publik', 'Dinas Kominfo', 'Kota Bandung', 'Briefcase', '#7c3aed', '#f5f3ff', 'Selesai', 650000000, 100, 100, 'Jan 2026', NULL),
    ('P-006', 'Normalisasi Sungai Cikapundung', 'Dinas PU', 'Kec. Dayeuhkolot', 'Drop', '#2563eb', '#eff6ff', 'Anomali', 3400000000, 91, 65, 'Feb 2026', 'Gap realisasi vs fisik: 26% — lewat deadline'),
    ('P-007', 'Renovasi Gedung Pelayanan Dinas Sosial', 'Dinas Sosial', 'Kec. Sumur Bandung', 'Buildings', '#d97706', '#fffbeb', 'Normal', 980000000, 44, 40, 'Ags 2026', NULL),
    ('P-008', 'Peningkatan Kualitas Sekolah Dasar', 'Dinas Pendidikan', 'Kota Bandung', 'Briefcase', '#7c3aed', '#f5f3ff', 'Normal', 2850000000, 63, 61, 'Des 2026', NULL);

-- Seed data dinas
INSERT INTO budget_dinas (name, short, budget, serap, color, bg, status) VALUES
    ('Dinas PU', 'PU', 'Rp 7.2M', 82, '#3b82f6', '#eff6ff', 'Normal'),
    ('Dinas Kesehatan', 'DK', 'Rp 5.8M', 71, '#27ae60', '#ecfdf5', 'Normal'),
    ('Dinas LH', 'LH', 'Rp 4.1M', 58, '#f59e0b', '#fffbeb', 'Anomali'),
    ('Dinas Sosial', 'DS', 'Rp 3.9M', 43, '#e74c3c', '#fef2f2', 'Anomali'),
    ('Dinas Pendidikan', 'DP', 'Rp 3.8M', 65, '#7c3aed', '#f5f3ff', 'Normal');

-- Index
CREATE INDEX IF NOT EXISTS idx_budget_projects_status ON budget_projects(status);
