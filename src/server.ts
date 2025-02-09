import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import s3Routes from './routes/s3Routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/s3', s3Routes);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
