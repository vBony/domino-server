import { Server, Socket } from "socket.io";
import { saveTable, loadTable, TableInterface } from "../storage/table";

export async function startGame(table: TableInterface, connection: Socket, server: Server){
    if(!table.gameStarted){
        generateDeck(table, connection)
        
        console.log('linha 9', table.players)
        for (const player of table.players) {
            // monta payload do ponto de vista do player atual
            const payload = table.players.map(p => ({
                ...p,
                stones: p.idSocket === player.idSocket // compara com o player que vai receber
                    ? p.stones                       // ele vê as próprias pedras completas
                    : p.stones.map(s => ({ id: s.id })) // pros outros, só ids
            }))
        
            // envia pro socket do player atual
            server.to(player.idSocket).emit("game:start", payload)
        }

        table.gameStarted = true
    }else{
        // continuar jogo
    }
}

// Gera todas as peças do dominó e dá IDs únicos para cada mesa
function generateDeck(table: TableInterface, connection: Socket) {
    let idCounter = 0
    let deck = []

    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({
                id: idCounter++,
                left: i,
                right: j
            })
        }
    }

    // Embaralha
    deck = deck
        .map((v) => ({ v, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ v }) => v)

    table.players.forEach(player => {
        let stones = deck.splice(0, 7)
        player.stones = stones
    });

    saveTable(table.code, table)
}

// Jogador faz uma jogada
// playStone(playerId: string, stoneId: number, side: "left" | "right") {
//     const player = this.players.find((p) => p.id === playerId)
//     if (!player) throw new Error("Jogador não encontrado")

//     // Verifica se é o turno dele
//     if (this.players[this.currentTurn].id !== playerId) {
//         throw new Error("Não é sua vez")
//     }

//     // Recupera a pedra real
//     const stoneIndex = player.stones.indexOf(stoneId)
//     if (stoneIndex === -1) throw new Error("Você não tem essa pedra")

//     const stone = this.findStoneById(stoneId)
//     if(!stone){
//         throw new Error("Pedra não encontrada")
//     }

//     // Primeira jogada
//     if (this.board.length === 0) {
//         this.board.push(stone)
//         player.stones.splice(stoneIndex, 1)
//         this.nextTurn()
//         return
//     }

//     // Valida jogada
//     const leftValue = this.board[0].left
//     const rightValue = this.board[this.board.length - 1].right

//     if (side === "left") {
//         if (stone.left === leftValue) {
//             this.board.unshift(stone)
//         } else if (stone.right === leftValue) {
//             this.board.unshift({ id: stone.id, left: stone.right, right: stone.left })
//         } else {
//             throw new Error("Jogada inválida")
//         }
//     } else {
//         if (stone.left === rightValue) {
//             this.board.push(stone)
//         } else if (stone.right === rightValue) {
//             this.board.push({ id: stone.id, left: stone.right, right: stone.left })
//         } else {
//             throw new Error("Jogada inválida")
//         }
//     }

//     // Remove pedra da mão do jogador
//     player.stones.splice(stoneIndex, 1)

//     // Próximo turno
//     this.nextTurn()
// }

// private findStoneById(stoneId: number) {
//     return (
//         this.deck.find((s) => s.id === stoneId) ||
//         this.board.find((s) => s.id === stoneId) ||
//         null
//     )
// }

// private nextTurn() {
//     this.currentTurn = (this.currentTurn + 1) % this.players.length
// }
