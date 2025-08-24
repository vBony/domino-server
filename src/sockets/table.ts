import { Server, Socket } from "socket.io";
import { User } from "../models/User";
import { TableStorage } from "../storage/table";
// import Game from "./Game";

export default class Table {
    tableCode: string;
    players: { id: string; nickname: string; idSocket: string; online: boolean }[];
    sockets: Map<string, Socket>;
    maxPlayersPerTable: number;
    server: Server;
    // game: Game | null;

    constructor(tableCode: string, server: Server) {
        this.tableCode = tableCode;
        this.players = [];
        this.maxPlayersPerTable = 4
        this.server = server
        this.sockets = new Map();
        // this.game = null;
    }

    async addPlayer(playerId: string, connection: Socket) {
        await this.load()

        if (!playerId) {
            // TODO: Add an emit informing that there was an error in the login
            return;
        }

        let existingPlayerIndex = this.players.findIndex(p => p.id == playerId);
        if (this.players.length >= this.maxPlayersPerTable && existingPlayerIndex === -1) {
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

        connection.join(this.tableCode);
        if (existingPlayerIndex !== -1) {
            const oldSocketId = this.players[existingPlayerIndex].idSocket;
    
            // renew socket on reconenct
            const sockets = await this.server.in(this.tableCode).fetchSockets();

            const oldSocket = sockets.find(s => s.id === oldSocketId);
            if (oldSocket) {
                oldSocket.leave(this.tableCode);
            }
            
            this.players[existingPlayerIndex].idSocket = connection.id
            this.players[existingPlayerIndex].online = true
        }else{
            this.players.push({
                ...user.toJSON(),
                idSocket: connection.id,
                online: true
            });
        }

        this.sockets.set(playerId, connection)

        // temp log
        if(existingPlayerIndex === -1){
            console.log(`úsuario ${playerId} conectado`)
        }else{
            console.log(`úsuario ${playerId} voltou ao jogo`)
        }

        this.save()

        // notifies everyone at the table
        this.server.to(this.tableCode).emit("player_joined", {
            players: this.players
        });

        // left from table
        connection.on("disconnect", async (reason) => {
            const index = this.players.findIndex(p => p.id == playerId);
    
            if (index !== -1) {
                this.players[index].online = false;
                console.log(`usuário ${playerId} desconectado`);
            }

            await this.save();
    
            // emit to the room that the player left
            this.server.to(this.tableCode).emit("player_left", {
                players: this.players,
                leftPlayer: playerId,
            });
        });
    }

    async load() {
        const data = await TableStorage.load(this.tableCode);
        console.log(data)
        if(data){
            this.players = data.players;
        }
    }

    async save() {
        await TableStorage.save(this.tableCode, { players: this.players });
        console.log(await TableStorage.load(this.tableCode))
    }

    startGame() {
    }

    listenForMoves() {
    }
}
