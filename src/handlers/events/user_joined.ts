import { Pool } from "pg";
import { Server, Socket } from "socket.io";

import { SocketEvents } from "../../constants";
import { setUserOnlineStatus } from "../../helpers";
import { UserData, UserJoinedIncomingDataType } from "../../types";
import { fetchCachedData } from "../common";

export const onUserJoined = async (
  userDetails: UserData,
  socket: Socket,
  io: Server,
  db: Pool,
  isAfterAuth: boolean,
  data: UserJoinedIncomingDataType,
  callback?: Function
) => {
  try {
    try {
      console.log(data);
      const {
        sync: { messageLatestTimestamp, roomLatestTimestamp },
        roomIds,
      } = data || { sync: {} };
      const res = await fetchCachedData(
        userDetails?.userId,
        {
          roomLatestTimestamp,
          messageLatestTimestamp,
          ...(isAfterAuth ? { requiredFeilds: ["notifications"] } : null),
        },
        db
      );
      if (res.response?.roomsData) {
        const tempRoomIds = res.response.roomsData?.rooms?.map(
          (room) => room?.roomId
        );
        tempRoomIds?.push(...(roomIds || []));
        socket.join(tempRoomIds || []);
      }
      callback?.(res.response);
    } catch (error: any) {
      callback?.({ error });
    } finally {
      await setUserOnlineStatus(userDetails?.userId, true, db);
      io.emit(SocketEvents.USER_JOINED, {
        userId: userDetails?.userId,
        status: true,
      });
    }
  } catch (error: any) {
    console.log(error);
  }
};
