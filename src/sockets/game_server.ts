// @ts-nocheck
import { Server, Socket } from "socket.io";
import setupTableSockets from "./table";

const maxPlayersPerTable = 4
let table = {}

export default function setupGameSockets(io: Server) {
    const gameNamespace = io.of("/game");

    gameNamespace.on('connection', async (socket) => {
        const userID = socket.handshake.query.userID as string;

        setupTableSockets(gameNamespace, socket);
    })
}
