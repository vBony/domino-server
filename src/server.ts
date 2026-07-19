import { Server } from "colyseus";
import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createPresence } from "./instances/redis";
import { DominoRoom } from "./rooms/DominoRoom";
import mainRoutes from "./routes/index";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/", mainRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
  presence: createPresence(),
});

gameServer.define("domino", DominoRoom);

const port = Number(process.env.PORT) || 3333;
gameServer.listen(port).then(() => {
  console.log(`Servidor rodando na porta ${port} 🚀`);
});
