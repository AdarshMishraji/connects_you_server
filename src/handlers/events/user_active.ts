import { Pool } from "pg";
import { Server } from "socket.io";
import { SocketEvents } from "../../constants";
import { setUserOnlineStatus } from "../../helpers";

export const onUserActive = async (userId: string, io: Server, db: Pool) => {
  try {
    await setUserOnlineStatus(userId, true, db);
    io.emit(SocketEvents.USER_JOINED, {
      userId,
      status: true,
    });
  } catch (error) {
    console.log(error);
  }
};
