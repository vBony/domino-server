import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AuthedRequest } from "../middlewares/auth";
import { PlayerService } from "../services/PlayerService";

function toUserDTO(user: { id: string; nickname: string }) {
  return { id: user.id, nickname: user.nickname };
}

export async function register(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }

  try {
    const { nickname, password } = req.body;
    const { user, token } = await PlayerService.register(nickname, password);
    return res.status(201).json({ user: toUserDTO(user), token });
  } catch (err) {
    if (err instanceof Error && err.message === "nickname_taken") {
      return res.status(409).json({ message: "Este nickname já está em uso" });
    }
    return res.status(500).json({ message: "Erro ao registrar usuário" });
  }
}

export async function login(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }

  try {
    const { nickname, password } = req.body;
    const { user, token } = await PlayerService.login(nickname, password);
    return res.status(200).json({ user: toUserDTO(user), token });
  } catch (err) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }
}

export async function guest(req: Request, res: Response) {
  const nickname = typeof req.body?.nickname === "string" ? req.body.nickname : undefined;
  const { user, token } = await PlayerService.loginAsGuest(nickname);
  return res.status(201).json({ user: toUserDTO(user), token });
}

export async function me(req: AuthedRequest, res: Response) {
  const auth = req.auth;
  if (!auth) return res.status(401).json({ message: "Não autenticado" });

  const user = await PlayerService.findById(auth.userId);
  if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

  return res.status(200).json({ user: toUserDTO(user) });
}
