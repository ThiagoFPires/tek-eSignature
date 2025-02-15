// src/config/awsConfig.ts
import { S3 } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Carregar as variáveis de ambiente
dotenv.config();

// Verificar se as variáveis de ambiente estão sendo lidas corretamente
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);

// Configuração do cliente S3
export const s3 = new S3({
  region: process.env.AWS_REGION || 'us-east-1', // Região do S3, com fallback se não estiver no .env
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// O nome do bucket é obtido da variável de ambiente
export const bucketName = process.env.AWS_BUCKET_NAME || ''; // Fallback para uma string vazia, se não estiver configurado
