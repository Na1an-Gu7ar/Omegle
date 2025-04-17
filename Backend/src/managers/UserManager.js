"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
var RoomManager_1 = require("./RoomManager");
var UserManager = /** @class */ (function () {
    function UserManager() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    UserManager.prototype.addUser = function (socket, name) {
        this.users.push({ socket: socket, name: name });
        this.queue.push(socket.id);
        socket.send("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    };
    UserManager.prototype.removeUser = function (socketId) {
        var user = this.users.find(function (user) { return user.socket.id === socketId; });
        this.users = this.users.filter(function (user) { return user.socket.id !== socketId; });
        this.queue = this.queue.filter(function (id) { return id === socketId; });
    };
    UserManager.prototype.clearQueue = function () {
        console.log("inside clearQueue");
        console.log(this.queue.length);
        if (this.queue.length < 2) {
            return;
        }
        console.log("creating room");
        var id1 = this.queue.pop();
        var id2 = this.queue.pop();
        var user1 = this.users.find(function (user) { return user.socket.id === id1; });
        var user2 = this.users.find(function (user) { return user.socket.id === id2; });
        console.log(user1, user2);
        if (!user1 || !user2) {
            return;
        }
        var room = this.roomManager.createRoom(user1, user2);
        this.clearQueue();
        // this.queue = this.queue.filter((id) => this.users.some((user) => user.socket.id === id))
    };
    UserManager.prototype.initHandlers = function (socket) {
        var _this = this;
        socket.on("offer", function (_a) {
            var sdp = _a.sdp, roomId = _a.roomId;
            console.log("offer received");
            _this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        socket.on("answer", function (_a) {
            var sdp = _a.sdp, roomId = _a.roomId;
            console.log("answer received");
            _this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("add-ice-candidate", function (_a) {
            var roomId = _a.roomId, candidate = _a.candidate, type = _a.type;
            console.log("ice candidate received");
            _this.roomManager.onIceCandidtaes(roomId, socket.id, candidate, type);
        });
    };
    return UserManager;
}());
exports.UserManager = UserManager;
