import { Pool } from "pg";
import { Server, Socket } from "socket.io";

import { createGroupRoom } from "../../helpers";
import { UserData } from "../../types";

export const onCreateGroupRoom = async (
  userDetails: UserData,
  socket: Socket,
  io: Server,
  db: Pool,
  data: { otherUserIds: string[]; roomName: string },
  callback?: Function
) => {
  try {
    const groupResponse = await createGroupRoom(
      userDetails?.userId,
      data?.otherUserIds,
      data.roomName,
      db
    );
    if (groupResponse.response?.room?.roomId) {
      socket.join([groupResponse.response?.room?.roomId]);
      //TODO emit to all users with their socket ids
      // io.emit(SocketEvents.ROOM_CREATED, {
      //   ...groupResponse.response.room,
      //   createdByUser: userDetails,
      //   toUserIds: data.otherUserIds,
      // });
      //TODO push notification to other user ids;
      callback?.({
        room: groupResponse?.response?.room,
        createdByUser: userDetails,
      });
    } else callback?.();
  } catch (error) {
    callback?.({ error });
  }
};
