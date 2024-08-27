// import type { HttpContext } from '@adonisjs/core/http'

export default class GameController {
    public async handlePlay({ socket, data, userID }) {
        console.log(`Play event received from user ${userID}`);
        console.log(data.peca);

        // Realizar lógica de jogo aqui

        // Enviar uma resposta para o cliente
        return socket.emit('playResponse', { message: 'Play event received and processed' });
    }

    public async playerJoined({socket, players}){
        socket.emit('player:joined', { players });
    }
}