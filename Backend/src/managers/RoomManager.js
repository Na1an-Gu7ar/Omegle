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
    RoomManager.prototype.onOffer = function (roomId, sdp) {
        var _a;
        var user2 = (_a = this.rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.user2;
        user2 === null || user2 === void 0 ? void 0 : user2.socket.emit("offer", {
            sdp: sdp,
            roomId: roomId,
        });
    };
    RoomManager.prototype.onAnswer = function (roomId, sdp) {
        var _a;
        var user1 = (_a = this.rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.user1;
        user1 === null || user1 === void 0 ? void 0 : user1.socket.emit("answer", {
            sdp: sdp,
            roomId: roomId,
        });
    };
    RoomManager.prototype.generateRoomId = function () {
        return GLOBAL_ROOM_ID++;
    };
    return RoomManager;
}());
exports.RoomManager = RoomManager;
