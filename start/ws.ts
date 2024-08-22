import app from '@adonisjs/core/services/app'
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'

app.ready(() => {
	const io = new Server(server.getNodeServer(), {
		cors: {
			origin: '*',
		},
	})
  
	io.on('connection', (socket) => {
		console.log(`Connected: ${socket.id}`);
	})

	io.on('error', (error) => {
		console.error('Socket.io Error:', error);
	});

	const connectedUsers = {};
	io.of('/play').on('connection', (socket) => {
		const userID = socket.handshake.query.userID;

		if(connectedUsers.length == 4){
			// Jogadores máximos atingido
			socket.disconnect()
		}
		
		if (connectedUsers[userID]) {
			// Se já houver uma conexão para esse usuário, desconecte o socket anterior
			connectedUsers[userID].disconnect();
		}

		// Armazene o socket atual
		connectedUsers[userID] = socket;
		console.log(`User ${userID} connected with socket ID: ${socket.id}`);

		socket.on('disconnect', () => {
			console.log(`User ${userID} disconnected`);
			delete connectedUsers[userID]; // Remova o usuário do mapa ao desconectar
		});

		socket.on('play', (data) => {
			console.log(`Play event received from user ${userID}`);

			console.log(data.peca)

			// Enviar uma resposta para o cliente
			socket.emit('playResponse', { message: 'Play event received and processed' });
		});
	});
})