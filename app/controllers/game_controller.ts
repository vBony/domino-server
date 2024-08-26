// import type { HttpContext } from '@adonisjs/core/http'

import User from "#models/user";

export default class GameController {
    public async handlePlay({ socket, data, userID }) {
        console.log(`Play event received from user ${userID}`);
        console.log(data.peca);

        // Realizar lógica de jogo aqui

        // Enviar uma resposta para o cliente
        socket.emit('playResponse', { message: 'Play event received and processed' });
    }

    public async playerJoined({socket, players}){
        // carregar dados dos jogadores
    }
}