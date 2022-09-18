import { Pool } from "pg";
import { Server } from "socket.io";

import { SocketEvents } from "../../constants";
import { setUserOnlineStatus } from "../../helpers";
import { UserData } from "../../types";

export const onDisconnect = async (
  userDetails: UserData,
  io: Server,
  db: Pool
) => {
  try {
    const onlineResposne = await setUserOnlineStatus(
      userDetails?.userId,
      false,
      db
    );
    if (onlineResposne.code < 500)
      io.emit(SocketEvents.USER_DISCONNECTED, {
        userId: userDetails?.userId,
        status: false,
      });
  } catch (error) {
    console.log(error);
  }
};
