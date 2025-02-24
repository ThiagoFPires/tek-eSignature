// src/controllers/s3Controller.ts
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3, bucketName } from '../config/awsConfig';

export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const filePath = req.file.path;
    const fileStream = fs.createReadStream(filePath);
    const fileName = req.file.originalname || `file-${Date.now()}`;

    // Verificar se o nome do bucket foi carregado corretamente
    console.log('Bucket Name:', bucketName); // Verifique se está retornando o nome correto

    const params = {
      Bucket: bucketName, // Usar o bucketName da configuração
      Key: fileName,
      Body: fileStream,
      ContentType: req.file.mimetype || 'application/octet-stream',
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    fs.unlinkSync(filePath);

    res.json({ message: 'Upload realizado!', key: fileName });
  } catch (error) {
    next(error);
  }
};

export const viewFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename } = req.params;
    if (!filename) {
      res.status(400).json({ error: 'Nome do arquivo não fornecido' });
      return;
    }

    const params = {
      Bucket: bucketName,
      Key: filename,
    };

    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    // Verificar o tipo do arquivo
    const contentType = data.ContentType || 'application/octet-stream';

    // Configura o cabeçalho para exibir o arquivo na tela em vez de baixar
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');

    if (data.Body) {
      (data.Body as NodeJS.ReadableStream).pipe(res);
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado.' });
    }
  } catch (error) {
    next(error);
  }
};
