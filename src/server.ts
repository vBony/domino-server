import express, {Request, Response} from 'express'
import mainRoutes from './routes/index'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import setupGameSockets from "./sockets/game_server";
import { Server } from "socket.io";
import http from "http";


dotenv.config()

const app = express()
app.use(express.json())
app.use(cors({
    origin: '*'
}))

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*", 
    },
});

setupGameSockets(io)

app.use(bodyParser.urlencoded({ extended: false }))

// acessa <url>/imgs/test.jpg
app.use(express.static('public'))

app.use('/', mainRoutes)

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" })
})

server.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT} 🚀`)
})