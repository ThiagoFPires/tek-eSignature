import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import s3Routes from './routes/s3Routes'; // Confirme se essas rotas estão corretas
import userRoutes from './routes/userRoutes';  // Certifique-se de que esta importação está correta

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ MongoDB conectado com sucesso'))
  .catch((error) => console.error('❌ Erro ao conectar no MongoDB:', error));

// Configuração do middleware
app.use(cors());
app.use(express.json()); // Importante para o Express processar o JSON no corpo das requisições

// Middleware de log para todas as requisições
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url}`);
  next();
});

// Definindo as rotas
app.use('/s3', s3Routes);
app.use('/user', userRoutes); // A rota /user vai ser tratada pelas rotas do arquivo userRoutes.ts

// Iniciando o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
