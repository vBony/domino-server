import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../instances/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const TOKEN_EXPIRES_IN = "7d";
const PASSWORD_SALT_ROUNDS = 10;

export interface AuthPayload {
  userId: string;
  username: string;
}

// Unico lugar que emite/valida JWT e cria/autentica usuarios. Usado tanto
// pelas rotas HTTP de auth quanto pelo onAuth() da DominoRoom, para que o
// mesmo token sirva para os dois mundos.
export class PlayerService {
  static signToken(payload: AuthPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
  }

  static verifyToken(token: string): AuthPayload {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  }

  static async register(nickname: string, password: string) {
    const existing = await prisma.user.findFirst({ where: { nickname, isGuest: false } });
    if (existing) throw new Error("nickname_taken");

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.create({ data: { nickname, passwordHash } });
    return { user, token: this.signToken({ userId: user.id, username: user.nickname }) };
  }

  static async login(nickname: string, password: string) {
    const user = await prisma.user.findFirst({ where: { nickname, isGuest: false } });
    if (!user || !user.passwordHash) throw new Error("invalid_credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("invalid_credentials");

    return { user, token: this.signToken({ userId: user.id, username: user.nickname }) };
  }

  // Cria um usuario descartavel so para permitir testar o multiplayer sem
  // exigir uma tela de cadastro completa (fica para uma proxima rodada).
  // O apelido sugerido pelo cliente e sempre usado como veio - guests nao
  // competem por unicidade de nome (nem entre si, nem com contas reais),
  // so caem para um nome aleatorio se nada for informado.
  static async loginAsGuest(nicknameHint?: string) {
    const trimmedHint = nicknameHint?.trim().slice(0, 20);
    const username = trimmedHint && trimmedHint.length > 0 ? trimmedHint : `Guest-${randomUUID().slice(0, 6)}`;

    const user = await prisma.user.create({ data: { nickname: username, isGuest: true } });
    return { user, token: this.signToken({ userId: user.id, username: user.nickname }) };
  }

  static async findById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } });
  }
}
