import { Server, Socket } from "socket.io";
import { User } from "../models/User";
import { saveTable, loadTable } from "../storage/table";
import {TableInterface} from "../storage/table"

const maxPlayersPerTable: number = 4
const socketConnections = new Map<string, Socket>();

export async function addPlayer(
    tableCode: string,
    playerId: string, 
    connection: Socket, 
    server: Server,
) {
    if (!playerId) {
        // TODO: Add an emit informing that there was an error in the login
        return;
    }

    let table: TableInterface = await loadTable(tableCode)
    let existingPlayerIndex = table.players.findIndex(p => p.id == playerId);

    if (table.players.length >= maxPlayersPerTable && existingPlayerIndex === -1) {
        connection.emit("table_full");
        return;
    }

    const user = await User.findByPk(playerId, {
        attributes: ['id', 'nickname']
    });

    if (!user) {
        // TODO: Add an emit informing that there was an error in the login
        return;
    }
    
    if (existingPlayerIndex !== -1) {
        const oldSocketId = table.players[existingPlayerIndex].idSocket;

        // renew socket on reconenct
        const sockets = await server.in(tableCode).fetchSockets();
        console.log(`aaefaef`, sockets)

        const oldSocket = sockets.find(s => s.id === oldSocketId);
        if (oldSocket) {
            oldSocket.leave(tableCode);
        }
        
        table.players[existingPlayerIndex].idSocket = connection.id
        table.players[existingPlayerIndex].online = true
    }else{
        table.players.push({
            ...user.toJSON(),
            idSocket: connection.id,
            online: true
        });
    }

    socketConnections.set(playerId, connection)
    connection.join('table');

    // temp log
    if(existingPlayerIndex === -1){
        console.log(`úsuario ${playerId} conectado`)
    }else{
        console.log(`úsuario ${playerId} voltou ao jogo`)
    }

    await saveTable(tableCode, table)

    // notifies everyone at the table
    server.in(tableCode).emit("player_joined", {
        players: table.players
    });

    if(table.players.length === maxPlayersPerTable){
        // startGame()
    }

    // left from table
    connection.on("disconnect", async (reason) => {
        const index = table.players.findIndex(p => p.id == playerId);

        if (index !== -1) {
            table.players[index].online = false;
        }

        await saveTable(tableCode, table)

        // emit to the room that the player left
        server.to(tableCode).emit("player_left", {
            players: table.players,
            leftPlayer: playerId,
        });
    });
}

function listenForMoves() {

}