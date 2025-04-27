import express from 'express';
import { cadastrar, login, obterPerfil } from '../controllers/UserController';
import { asyncHandler } from '../utils/asyncHandler'; // usando o asyncHandler igual no s3Routes

const router = express.Router();

// Cadastro de usuário
router.post('/cadastrar', asyncHandler(cadastrar));

// Login de usuário
router.post('/login', asyncHandler(login));

// Perfil do usuário
router.get('/perfil', asyncHandler(obterPerfil));

export default router;
