import { NextFunction, Request, Response } from "express";
import { PlayerService } from "../services/PlayerService";

export interface AuthedRequest extends Request {
  auth?: { userId: string; username: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return res.status(401).json({ message: "Token não informado" });
  }

  try {
    req.auth = PlayerService.verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}
