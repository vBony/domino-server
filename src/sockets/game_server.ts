// @ts-nocheck
import { Server, Socket } from "socket.io";
import Table from "./table";

const maxPlayersPerTable = 4
let table = {}
const tableCode = 'table'

export default function setupGameSockets(io: Server) {
    const queue = io.of("/queue");

    queue.on('connection', async (playerConnection) => {
        const userID = playerConnection.handshake.query.userID as string;

        const table = new Table(tableCode, queue)
        table.addPlayer(userID, playerConnection)
    })
}
