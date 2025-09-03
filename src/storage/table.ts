export interface PlayerInterface {
    id: string
    name: string
    idSocket: string
    stones: {
        id?: number,
        left?: number,
        right?: number
    }[]
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
    code: string,
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
        return createEmptyTable(tableName)
    }
}

export async function saveTable(tableName: string, data: any) {
    tables[tableName] = data;
}

function createEmptyTable(tableName:string): TableInterface {
    return {
        code: tableName,
        players: [],
        board: [],
        moves: [],
        gameStarted: false
    };
}