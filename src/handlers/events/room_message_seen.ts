import { Pool } from "pg";
import { Socket } from "socket.io";

import { SocketEvents } from "../../constants";
import { insertMessageSeenInfo } from "../../helpers";
import { UserData } from "../../types";

export const onRoomMessageSeen = (
  userDetails: UserData,
  socket: Socket,
  data: {
    messageIds: string[];
    roomId: string;
  },
  callback: ({}: { messageIds?: string[]; messageSeenAt?: string }) => void,
  db: Pool
) => {
  const seenAt = Date.now().toString();
  insertMessageSeenInfo(data.messageIds, userDetails.userId, seenAt, db)
    .then((value) => {
      console.log({ value, data });
      socket.to(data.roomId).emit(SocketEvents.ROOM_MESSAGE_SEEN, {
        roomId: data.roomId,
        messageIds: data.messageIds,
        messageSeenAt: seenAt,
        messageSeenByUserId: userDetails.userId,
      });
      callback?.({
        messageIds: value.response?.messageIds,
        messageSeenAt: seenAt,
      });
    })
    .catch((error) => {
      console.log(error);
      callback?.({});
    });
};
