export interface PlayerInterface {
    id: string
    name: string
    idSocket: string
    stones: number[] // ids das pedras que o player tem
    online: boolean
}

interface Move {
    playerId: number
    stoneId: number
    side: 'left' | 'right'
    timestamp: number
}

export interface BoardStoneInterface {
    id: number
    left: number
    right: number
}

export interface TableInterface {
    players: PlayerInterface[] // { playerId: Player }
    board: BoardStoneInterface[] // pedras na mesa em ordem
    moves: Move[] // histórico das jogadas
    gameStarted: boolean
}

const tables: Record<string, TableInterface> = {};

export async function loadTable(tableName: string) {
    if(tables[tableName]){
        return tables[tableName];
    }else{
        return createEmptyTable()
    }
}

export async function saveTable(tableName: string, data: any) {
    tables[tableName] = data;
}

function createEmptyTable(): TableInterface {
    return {
        players: [],
        board: [],
        moves: [],
        gameStarted: false
    };
}