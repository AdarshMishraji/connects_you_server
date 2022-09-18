import { Socket } from "socket.io";

import { NetworkResponse } from "../../constants";
import { Resolve } from "../../utils";

export const onJoinRoomId = (
  socket: Socket,
  data: { roomId: string },
  callback?: Function
) => {
  if (data.roomId) {
    socket.join(data.roomId);
    callback?.(
      new Resolve({
        ...NetworkResponse.SUCCESS,
        response: "Your hare join to roomId" + data.roomId,
      })
    );
  }
};
