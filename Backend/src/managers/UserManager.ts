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
        console.log("inside clearQueue");
        console.log(this.queue.length);
        
        if(this.queue.length < 2) {
            return
        }

        console.log("creating room");

        const id1 = this.queue.pop()
        const id2 = this.queue.pop()

        const user1 = this.users.find((user) => user.socket.id === id1)
        const user2 = this.users.find((user) => user.socket.id === id2)

        console.log(user1, user2);
        if(!user1 || !user2) {
            return
        }

        const room = this.roomManager.createRoom(user1, user2)
        this.clearQueue()
        // this.queue = this.queue.filter((id) => this.users.some((user) => user.socket.id === id))
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({sdp, roomId}: {sdp: string, roomId: string}) => {
            console.log("offer received");
            this.roomManager.onOffer(roomId, sdp)
        })
        
        socket.on("answer", ({sdp, roomId}: {sdp: string, roomId: string}) => {
            console.log("answer received");
            this.roomManager.onAnswer(roomId, sdp)
        })
    }
}