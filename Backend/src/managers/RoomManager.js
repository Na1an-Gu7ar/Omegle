"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
var GLOBAL_ROOM_ID = 1;
var RoomManager = /** @class */ (function () {
    function RoomManager() {
        this.rooms = new Map();
    }
    RoomManager.prototype.createRoom = function (user1, user2) {
        var roomId = this.generateRoomId().toString();
        this.rooms.set(roomId.toString(), { user1: user1, user2: user2 });
        user1.socket.emit("send-offer", {
            roomId: roomId,
        });
    };
    RoomManager.prototype.onOffer = function (roomId, sdp, senderSocketid) {
        var room = this.rooms.get(roomId);
        if (!room)
            return;
        var receivingUser = room.user1.socket.id == senderSocketid ? room.user2 : room.user1;
        receivingUser === null || receivingUser === void 0 ? void 0 : receivingUser.socket.emit("offer", {
            sdp: sdp,
            roomId: roomId,
        });
    };
    RoomManager.prototype.onAnswer = function (roomId, sdp, senderSocketid) {
        var room = this.rooms.get(roomId);
        if (!room)
            return;
        var receivingUser = room.user1.socket.id == senderSocketid ? room.user2 : room.user1;
        receivingUser === null || receivingUser === void 0 ? void 0 : receivingUser.socket.emit("answer", {
            sdp: sdp,
            roomId: roomId,
        });
    };
    RoomManager.prototype.onIceCandidtaes = function (roomId, senderSocketid, candidate, type) {
        var room = this.rooms.get(roomId);
        if (!room)
            return;
        var receivingUser = room.user1.socket.id == senderSocketid ? room.user2 : room.user1;
        receivingUser.socket.emit("add-ice-candidate", ({ candidate: candidate, type: type }));
    };
    RoomManager.prototype.generateRoomId = function () {
        return GLOBAL_ROOM_ID++;
    };
    return RoomManager;
}());
exports.RoomManager = RoomManager;
