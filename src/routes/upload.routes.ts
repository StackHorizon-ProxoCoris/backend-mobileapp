// ============================================================
// Routes — Upload (File Upload)
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import { uploadPhoto, deletePhoto } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Konfigurasi multer — simpan file di memory (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5MB
    files: 1,                  // Satu file per request
  },
});

// POST /api/upload — Upload foto (perlu login)
router.post('/', authMiddleware, upload.single('file'), uploadPhoto);

// DELETE /api/upload/:filename — Hapus foto (perlu login)
// Menggunakan query param karena filename berisi path (userId/file.jpg)
router.delete('/', authMiddleware, deletePhoto);

export default router;
