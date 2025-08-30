import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3, bucketName } from '../config/awsConfig';
import zlib from 'zlib';
import stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);

// ---------- UPLOAD COMPACTANDO ----------
export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const filePath = req.file.path;

    const fileBuffer = fs.readFileSync(filePath);

    const compressedBuffer = zlib.gzipSync(fileBuffer);

    const originalName = req.file.originalname;
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}.gz`;

    const params = {
      Bucket: bucketName,
      Key: fileName,                 
      Body: compressedBuffer,
      ContentType: 'application/gzip',
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    fs.unlinkSync(filePath);

    res.json({
      message: 'Upload realizado com compactação!',
      key: fileName, // teste.gz
      originalSize: fileBuffer.length,
      compressedSize: compressedBuffer.length,
    });
  } catch (error) {
    next(error);
  }
};


// ---------- DOWNLOAD DESCOMPACTANDO ----------
export const viewFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { filename } = req.params;
    if (!filename) {
      res.status(400).json({ error: 'Nome do arquivo não fornecido' });
      return;
    }

    const s3Key = filename.endsWith('.gz') ? filename : `${filename.replace(/\.[^/.]+$/, '')}.gz`;

    const params = {
      Bucket: bucketName,
      Key: s3Key,
    };

    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    let downloadName = s3Key.replace(/\.gz$/, '');
    if (!/\.[^/.]+$/.test(downloadName)) {
      downloadName += '.pdf';
    }

    let contentType = 'application/octet-stream';
    if (downloadName.endsWith('.pdf')) contentType = 'application/pdf';
    else if (downloadName.endsWith('.png')) contentType = 'image/png';
    else if (downloadName.endsWith('.jpg') || downloadName.endsWith('.jpeg')) contentType = 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);

    if (data.Body) {
      const gunzip = zlib.createGunzip();
      (data.Body as NodeJS.ReadableStream).pipe(gunzip).pipe(res);
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado.' });
    }
  } catch (error) {
    next(error);
  }
};