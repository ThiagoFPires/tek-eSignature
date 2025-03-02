import express from 'express';
import { uploadFile, viewFile } from '../controllers/s3Controller';

const router = express.Router();

router.post('/upload', uploadFile);
router.get('/view/:filename', viewFile);

export default router;
