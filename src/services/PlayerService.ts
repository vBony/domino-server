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

  // Sem tela de cadastro completa ainda, entao este e o unico fluxo de
  // entrada usado pelo client. Regra pedida pelo usuario, "por enquanto":
  // - Nome informado: procura por esse nickname em TODA a tabela (guest ou
  //   nao) e loga como quem encontrar, tipo um login sem senha; se nao
  //   encontrar, cria um usuario novo com esse nome (marcado isGuest).
  // - Nome nao informado: sempre cria um guest novo com nome aleatorio.
  //
  // Risco de seguranca aceito conscientemente pra esta fase: como a busca
  // nao filtra por isGuest, se alguem registrar uma conta com senha
  // (POST /auth/register) e outra pessoa digitar o mesmo nickname aqui,
  // ela entra como aquela conta sem digitar senha nenhuma. Nao e um
  // problema pratico agora porque o client so chama este endpoint (nunca
  // register/login), mas precisa ser revisto antes de existir uma tela de
  // cadastro/login de verdade.
  static async loginAsGuest(nicknameHint?: string) {
    const trimmedHint = nicknameHint?.trim().slice(0, 20);

    if (trimmedHint) {
      const existing = await prisma.user.findFirst({ where: { nickname: trimmedHint } });
      if (existing) {
        return { user: existing, token: this.signToken({ userId: existing.id, username: existing.nickname }) };
      }
    }

    const username = trimmedHint && trimmedHint.length > 0 ? trimmedHint : `Guest-${randomUUID().slice(0, 6)}`;
    const user = await prisma.user.create({ data: { nickname: username, isGuest: true } });
    return { user, token: this.signToken({ userId: user.id, username: user.nickname }) };
  }

  static async findById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId } });
  }
}
