import app from '@adonisjs/core/services/app'
import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import GameController from '#controllers/game_controller'
import User from "#models/user";
const game = new GameController()

import Player from "#entities/player"

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

	let players = {}
	let playersInstance = {}
	io.of('/play').on('connection', async (socket) => {
		const idUser = socket.handshake.query.userID;
		let player = new Player()
		let totalPlayers = io.of("/play").sockets.size
		let reconnecting = false

		if (playersInstance[idUser]) {
			// Se já houver uma conexão para esse usuário, desconecta o socket anterior
			reconnecting = true // Flag para possibilitar reconectar
			playersInstance[idUser].disconnect();
			delete playersInstance[idUser];
		}

		// Apenas 4 jogadores
		if(totalPlayers > 4 && !reconnecting){
			socket.emit('game:full');
			socket.disconnect()
			return
		}

		// Armazene o socket atual
		player.socketId = socket.id
		player.tablePosition = totalPlayers
		player.id = parseInt(idUser)
		player.model = await User.find(player.id)

		playersInstance[idUser] = socket;
		players[idUser] = player

		console.log(`User ${idUser} connected with socket ID: ${socket.id}`);
		// await game.playerJoined({socket, players})
		socket.broadcast.emit('player:joined', { players });


		socket.on('game:play', async (data) => {
			// Chame o método do controller passando o socket, data e userID
			await game.handlePlay({ socket, data, idUser });
		});

		// Evento quando o usuário desconecta
		socket.on('disconnect', () => {
			console.log(`User ${idUser} disconnected`);
			// Remove o usuário do jogo ao desconectar
			delete playersInstance[idUser]; 
			delete players[idUser]
			socket.broadcast.emit('player:disconnected', { players });
		});

	});
})