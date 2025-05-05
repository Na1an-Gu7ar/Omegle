import { io } from "socket.io-client";

const socket = io(process.env.BACKEND_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
});

export default socket;
