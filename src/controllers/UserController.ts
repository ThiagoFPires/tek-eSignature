import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

// Cadastro do usuário
export const cadastrar = async (req: Request, res: Response): Promise<void> => {
  console.log("➡️ Rota /register chamada");
  const { nome, email, senha } = req.body;
  console.log("📦 Dados recebidos para cadastro:", { nome, email });

  try {
    const usuarioExistente = await User.findOne({ email });
    console.log("🔍 Verificando se o usuário existe:", usuarioExistente);

    if (usuarioExistente) {
      console.log("⚠️ Usuário já existe");
      res.status(400).json({ msg: "Usuário já existe" });
      return;
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const usuario = new User({ nome, email, senha: senhaCriptografada });
    await usuario.save();

    console.log("✅ Usuário cadastrado com sucesso");
    res.status(201).json({ msg: "Usuário cadastrado com sucesso" });
  } catch (erro) {
    console.error("❌ Erro ao cadastrar usuário:", erro);
    res.status(500).json({ msg: "Erro ao cadastrar o usuário" });
  }
};

// Login do usuário
export const login = async (req: Request, res: Response): Promise<void> => {
  console.log("➡️ Rota /login chamada");
  const { email, senha } = req.body;
  console.log("📦 Dados recebidos para login:", { email });

  try {
    const usuario = await User.findOne({ email });
    console.log("🔍 Verificando usuário:", usuario);

    if (!usuario) {
      console.log("⚠️ Usuário não encontrado");
      res.status(400).json({ msg: "Usuário não encontrado" });
      return;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    console.log("🔐 Senha válida:", senhaValida);

    if (!senhaValida) {
      console.log("⚠️ Senha incorreta");
      res.status(401).json({ msg: "Senha incorreta" });
      return;
    }

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    console.log("✅ Login bem-sucedido, token gerado");
    res.json({ token, nome: usuario.nome });
  } catch (erro) {
    console.error("❌ Erro ao realizar login:", erro);
    res.status(500).json({ msg: "Erro ao realizar o login" });
  }
};

// Rota protegida - perfil do usuário
export const obterPerfil = async (req: Request, res: Response): Promise<void> => {
  console.log("➡️ Rota /profile chamada");

  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    console.log("⚠️ Token não fornecido");
    res.status(401).json({ msg: "Acesso negado. Token não fornecido." });
    return;
  }

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    console.log("✅ Token decodificado:", decodificado);

    const usuarioId = decodificado.id;
    const usuario = await User.findById(usuarioId);
    console.log("🔍 Usuário encontrado:", usuario);

    if (!usuario) {
      console.log("⚠️ Usuário não encontrado no banco");
      res.status(404).json({ msg: "Usuário não encontrado" });
      return;
    }

    console.log("✅ Perfil retornado com sucesso");
    res.json({ nome: usuario.nome, email: usuario.email });
  } catch (erro) {
    console.error("❌ Erro ao verificar token ou recuperar perfil:", erro);
    res.status(400).json({ msg: "Token inválido ou expirado" });
  }
};
