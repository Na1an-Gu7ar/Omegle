import { User } from "./UserManager"

let GLOBAL_ROOM_ID = 1

interface Room {
    user1: User,
    user2: User,
}

export class RoomManager {
    private rooms: Map<string, Room>

    constructor() {
        this.rooms = new Map<string, Room>()
    }

    createRoom(user1: User, user2: User) {
        const roomId = this.generateRoomId()
        const room: Room = { user1, user2 }
        this.rooms.set(roomId.toString(), room)

        user1.socket.emit("send-offer", {
            type: "send-offer",
            roomId,
        })
    }

    onOffer(roomId: string, sdp: string) {
        const user2 = this.rooms.get(roomId)?.user2
        user2?.socket.emit("offer", {
            sdp
        })
    }

    onAnswer(roomId: string, sdp: string) {
        const user1 = this.rooms.get(roomId)?.user1
        user1?.socket.emit("offer", {
            sdp
        })
    }

    generateRoomId() {
        return GLOBAL_ROOM_ID++
    }
}