import { Server } from "socket.io";

let io = null;

export function initSocket(server){
   io = new Server(server, {
        cors: {
            origin: "*"
        }
    });
    return io;
}

export default function getIO(){
    if(!io){
        throw new Error("Socket.io not initialized!");
    }
    return io;
}