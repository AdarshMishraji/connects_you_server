import { Pool } from "pg";
import { Socket } from "socket.io";

import { SocketEvents } from "../../constants";
import { insertMessage } from "../../helpers";
import { MessageData } from "../../types/message";

export const onSendMessage = async (
  userDetails: any,
  socket: Socket,
  db: Pool,
  messageBody: MessageData,
  callback?: Function
) => {
  try {
    if (messageBody.messageId) {
      const messageResponse = await insertMessage(messageBody, db);
      callback?.(messageResponse.response);
      socket.to(messageBody.roomId).emit(SocketEvents.ROOM_MESSAGE, {
        messageBody: messageBody,
        senderUserDetails: userDetails,
      });
    } else callback?.({ error: "No message Id" });
  } catch (error) {
    console.log(error);
  }
};
