import { Socket } from "socket.io";

import { SocketEvents } from "../../constants";
import { UserData } from "../../types";

export const onUserTyping = (
  userDetails: UserData,
  socket: Socket,
  data: { roomId: string; isTyping: boolean },
  callback?: () => void
) => {
  socket
    .to(data.roomId)
    .emit(SocketEvents.USER_TYPING, {
      user: userDetails,
      roomId: data.roomId,
      isTyping: data.isTyping,
    });
  callback?.();
};
