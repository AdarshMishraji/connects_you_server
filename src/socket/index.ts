import { Pool } from "pg";
import { Server, Socket } from "socket.io";

import { SocketEvents } from "../constants";
import {
    onCreateGroupRoom,
    onCreateOrJoinDuetRoom,
    onDisconnect,
    onJoinRoomId,
    onRoomMessageSeen,
    onSendMessage,
    onUserActive,
    onUserJoined,
    onUserTyping,
} from "../handlers";
import { onDeleteMessages } from "../handlers/events/delete_room_messages";

export * from "./initialise";

export const socketConnection = async (socket: Socket, io: Server) => {
    console.log("on socket con initiated");
    const db: Pool = socket.data.db;
    const userDetails = socket.data.userDetails;

    // SocketTracker.userSocketId = { [userDetails.userId]: socket.id };
    socket.use((event, next) => {
        console.log("socket event =>>>>", event);
        next();
    });
    socket.on(SocketEvents.USER_JOINED_AFTER_AUTH, (data, callback) =>
        onUserJoined(userDetails, socket, io, db, true, data, callback)
    );
    socket.on(SocketEvents.USER_JOINED, (data, callback) =>
        onUserJoined(userDetails, socket, io, db, false, data, callback)
    );
    socket.on(SocketEvents.CREATE_OR_JOIN_DUET_ROOM, (data, callback) =>
        onCreateOrJoinDuetRoom(userDetails, socket, io, db, data, callback)
    );
    socket.on(SocketEvents.CREATE_GROUP_ROOM, (data, callback) =>
        onCreateGroupRoom(userDetails, socket, io, db, data, callback)
    );
    socket.on(SocketEvents.JOIN_ROOMID, (data, callback) =>
        onJoinRoomId(socket, data, callback)
    );
    socket.on(SocketEvents.ROOM_MESSAGE, (data, callback) =>
        onSendMessage(userDetails, socket, db, data, callback)
    );
    socket.on(SocketEvents.DELETE_ROOM_MESSAGES, (data, callback) => {
        onDeleteMessages(userDetails, socket, data, callback, db);
    });
    socket.on(SocketEvents.ROOM_MESSAGE_SEEN, (data, callback) => {
        onRoomMessageSeen(userDetails, socket, data, callback, db);
    });
    socket.on(SocketEvents.USER_TYPING, (data, callback) =>
        onUserTyping(userDetails, socket, data, callback)
    );
    socket.on(SocketEvents.USER_ACTIVE, async () => {
        onUserActive(userDetails.userId, io, db);
    });
    socket.on(SocketEvents.USER_INACTIVE, () => {
        onDisconnect(userDetails, io, db);
    });
    socket.on(SocketEvents.DISCONNECT, () => {
        // delete SocketTracker.userSocketId[userDetails.userId];
        onDisconnect(userDetails, io, db);
    });
    socket.on("ping", (...args) => {
        console.log(args);
    });
};
