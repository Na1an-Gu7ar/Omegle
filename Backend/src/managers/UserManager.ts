import { Socket } from "socket.io"
import { RoomManager } from "./RoomManager"

export interface User {
    socket: Socket
    name: string
}

export class UserManager {
    private users: User[]
    private queue: string[]
    private roomManager: RoomManager

    constructor() {
        this.users = []
        this.queue = []
        this.roomManager = new RoomManager()
    }

    addUser(socket: Socket, name: string) {
        this.users.push({ socket, name })
        this.queue.push(socket.id)
        socket.send("lobby")
        this.clearQueue()
        this.initHandlers(socket)
    }

    removeUser(socketId: string) {
        const user = this.users.find((user) => user.socket.id === socketId)

        this.users = this.users.filter((user) => user.socket.id !== socketId)
        this.queue = this.queue.filter((id) => id === socketId)
    }

    clearQueue() {
        if(this.queue.length < 2) {
            return
        }

        const user1 = this.users.find((user) => user.socket.id === this.queue.pop())
        const user2 = this.users.find((user) => user.socket.id === this.queue.pop())

        if(!user1 || !user2) {
            return
        }

        const room = this.roomManager.createRoom(user1, user2)
        this.clearQueue()
        // this.queue = this.queue.filter((id) => this.users.some((user) => user.socket.id === id))
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({sdp, roomId}: {sdp: string, roomId: string}) => {
            this.roomManager.onOffer(roomId, sdp)
        })
        
        socket.on("answer", ({sdp, roomId}: {sdp: string, roomId: string}) => {
            this.roomManager.onAnswer(roomId, sdp)
        })
    }
}