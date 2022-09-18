import { Pool } from "pg";
import { Socket } from "socket.io";

import { SocketEvents } from "../../constants";
import { deleteMessages } from "../../helpers";
import { UserData } from "../../types";

export const onDeleteMessages = async (
  userDetails: UserData,
  socket: Socket,
  data: {
    messageIds: string[];
    roomId: string;
  },
  callback: Function,
  db: Pool
) => {
  try {
    const messageResponse = await deleteMessages(
      data.messageIds,
      userDetails.userId,
      data.roomId,
      db
    );
    socket.to(data.roomId).emit(SocketEvents.DELETE_ROOM_MESSAGES, {
      roomId: data.roomId,
      messageIds: data.messageIds,
    });
    callback?.(
      messageResponse.response ? messageResponse.response.messageIds : []
    );
  } catch (error) {
    callback?.({ error });
  }
};
