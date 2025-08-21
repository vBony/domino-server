// @ts-nocheck
import { Server, Socket } from "socket.io";

let salas = []

export default function setupGameSockets(io: Server) {
    io.on("connection", (socket: Socket) => {
        
    });
}
