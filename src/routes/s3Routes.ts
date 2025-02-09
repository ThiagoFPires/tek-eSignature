import express from 'express';
import { upload } from '../middlewares/uploadMiddleware';
import { uploadFile, downloadFile } from '../controllers/s3Controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.post('/upload', upload.single('file'), asyncHandler(uploadFile));
router.get('/download/:filename', asyncHandler(downloadFile));

export default router;
