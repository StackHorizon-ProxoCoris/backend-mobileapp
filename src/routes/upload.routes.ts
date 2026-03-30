// ============================================================
// Routes — Upload (File Upload)
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import { uploadPhoto, deletePhoto } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authenticatedGeneralRateLimiter, createUploadRateLimiter } from '../config/rate-limit';

const router = Router();
const uploadRateLimiter = createUploadRateLimiter();

router.use(authMiddleware, authenticatedGeneralRateLimiter, uploadRateLimiter);

// Konfigurasi multer — simpan file di memory (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5MB
    files: 1,                  // Satu file per request
  },
});

// POST /api/upload — Upload foto (perlu login)
router.post('/', upload.single('file'), uploadPhoto);

// DELETE /api/upload/:filename — Hapus foto (perlu login)
// Menggunakan query param karena filename berisi path (userId/file.jpg)
router.delete('/', deletePhoto);

export default router;
