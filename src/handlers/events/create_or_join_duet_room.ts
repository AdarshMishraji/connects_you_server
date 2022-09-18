import { Pool } from "pg";
import { Server, Socket } from "socket.io";

import { SocketEvents } from "../../constants";
import { createDuetRoomIfNotExists } from "../../helpers";
import { SocketTracker } from "../../socket/trackSockets";
import { UserData } from "../../types";

export const onCreateOrJoinDuetRoom = async (
  userDetails: UserData,
  socket: Socket,
  io: Server,
  db: Pool,
  data: { otherUserId: string },
  callback?: Function
) => {
  try {
    const roomResponse = await createDuetRoomIfNotExists(
      userDetails?.userId,
      data?.otherUserId,
      db
    );
    if (roomResponse.response?.room?.roomId) {
      socket.join([roomResponse.response?.room?.roomId]);
      if (SocketTracker.userSocketId[data.otherUserId]) {
        io.to(SocketTracker.userSocketId[data.otherUserId]).emit(
          SocketEvents.ROOM_CREATED,
          {
            ...roomResponse.response.room,
            createdByUser: userDetails,
          }
        );
      }
      //TODO: push notification to other user id;
      callback?.({
        room: roomResponse?.response?.room,
        createdByUser: userDetails,
      });
    } else callback?.();
  } catch (error) {
    callback?.({ error });
  }
};
