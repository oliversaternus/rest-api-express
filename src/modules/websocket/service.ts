import { Server as SocketIO } from "socket.io";
import { Server } from 'http';
import { decryptUser } from "../authentication/tools";

let io: SocketIO;

export const init = async (server: Server) => {
    io = new SocketIO(server);

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                next(new Error("Auth token missing"));
            }
            const user = decryptUser(token);
            if (!user) {
                next(new Error("Authentication failed"));
            }
            socket.data.user = user;
            // Save connection
            // const id = socket.id;

            // Join room
            // socket.join();
            return next();
        } catch (e) {
            return next();
        }
    });

    io.on("connection", async (socket) => {
        socket.on("disconnect", () => {
            try {
                // delete saved connection
                // const id = socket.id;
            } catch (e) {
                console.log(e);
            }
        });
    });
};

export const WebsocketService = {
    emit: (ev: string, ...args: any[]) => {
        return io.emit(ev, ...args);
    },
    emitTo: (options: { to: string | string[], event: string, arguments: any[] }) => {
        return io.to(options.to).emit(options.event, ...options.arguments);
    },
    send: (...args: any[]) => {
        return io.send(...args);
    },
    sendTo: (options: { to: string | string[], arguments: any[] }) => {
        return io.to(options.to).emit('message', ...options.arguments);
    }
};