// @ts-nocheck
import { User } from "../models/User";

const maxPlayersPerTable = 4;

let tableName = 'table'
let players = []
let totalPlayers = 0

export default async function setupTableSockets(game, socket) {
    const userID = socket.handshake.query.userID as string;    

    if (!userID) {
        socket.disconnect();
        return;
    }

    // Checa se o jogador já está na mesa
    let existingPlayerIndex = players.findIndex(p => p.id == userID);

    // Checa se a mesa está cheia
    if (totalPlayers >= maxPlayersPerTable && existingPlayerIndex === -1) {
        socket.emit("table_full");
        socket.disconnect();
        return;
    }
    
    const user = await User.findByPk(userID, {
        attributes: ['id', 'nickname']
    });

    if (!user) {
        socket.disconnect();
        return;
    }

    // Checa se o jogador já está conectado
    if (existingPlayerIndex !== -1) {
        const oldSocketId = players[existingPlayerIndex].socketId;

        // Remove o socket antigo da sala
        const oldSocket = game.sockets.get(oldSocketId);
        if (oldSocket) {
            oldSocket.leave(tableName);
            oldSocket.disconnect(true);
        }

        players[existingPlayerIndex].socketId = socket.id
        players[existingPlayerIndex].online = true
    }else{
        players.push({
            ...user.toJSON(),
            socketId: socket.id,
            online: true
        });
    }
    
    totalPlayers = players.length

    if(existingPlayerIndex === -1){
        console.log(`úsuario ${userID} conectado`)
    }else{
        console.log(`úsuario ${userID} voltou ao jogo`)
    }

    socket.join(tableName);

    // Notifica todos da mesa
    game.to(tableName).emit("player_joined", {
        players
    });

    // Saiu da mesa
    socket.on("disconnect", () => {
        const index = players.findIndex(p => p.id == userID);

        if (index !== -1) {
            players[index].online = false;
            console.log(`usuário ${userID} desconectado, total: ${players.length}`);
        }

        game.to(tableName).emit("player_left", {
            players,
            leftPlayer: userID,
        });
    });
}
