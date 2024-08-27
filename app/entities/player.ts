import User from "#models/user"

export default class Player {
    id: number | null = null
    socketId: string | null = null
    tablePosition: number | null = null
    model: User | null = null
}