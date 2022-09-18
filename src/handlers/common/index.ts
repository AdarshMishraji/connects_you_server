import { Pool } from "pg";

import { NetworkResponse } from "../../constants";
import {
  fetchEncryptedStringForUser,
  fetchMessagesForUser,
  fetchNotificationsForUser,
  fetchRoomsForUser,
} from "../../helpers";
import {
  EndToEndEncryptedStringsData,
  NotificationData,
  RoomType,
  RoomUserType,
} from "../../types";
import { Reject, Resolve } from "../../utils";

type CachedDataType = {
  roomsData?: { rooms?: RoomType[]; roomUsers?: RoomUserType[] };
  messages?: { [roomId: string]: any[] };
  notifications?: NotificationData[];
  encryptedStrings?: EndToEndEncryptedStringsData[];
  error?: any;
};

const onAllSettled = (
  responses: PromiseSettledResult<Resolve | Resolve | Resolve>[]
) => {
  const dataToSend: CachedDataType = {};

  if (responses?.[0]?.status === "fulfilled")
    dataToSend.roomsData = responses?.[0].value.response;
  else {
    if (responses?.[0]?.reason?.code === NetworkResponse.NOT_FOUND.code)
      dataToSend.roomsData = { roomUsers: [], rooms: [] };
    else
      dataToSend.error = {
        errorOccuredAt: "roomsData",
        error: responses?.[0]?.reason,
      };
  }

  if (responses?.[1]?.status === "fulfilled") {
    const roomMessages: { [roomId: string]: any[] } = {};
    responses[1].value.response?.messages.forEach((messageBody: any) => {
      if (roomMessages?.[messageBody.roomId]?.length > 0)
        roomMessages[messageBody.roomId].push(messageBody);
      else roomMessages[messageBody.roomId] = [messageBody];
    });
    dataToSend.messages = roomMessages;
  } else {
    if (responses?.[1]?.reason?.code === NetworkResponse.NOT_FOUND.code)
      dataToSend.messages = {};
    else
      dataToSend.error = {
        errorOccuredAt: "messages",
        error: responses?.[1]?.reason,
      };
  }

  if (responses?.[2]?.status == "fulfilled")
    dataToSend.notifications = responses[2].value.response;
  else {
    if (responses?.[2]?.reason?.code === NetworkResponse.NOT_FOUND.code)
      dataToSend.notifications = [];
    else
      dataToSend.error = {
        errorOccuredAt: "notifications",
        error: responses?.[2]?.reason,
      };
  }

  if (responses?.[3]?.status == "fulfilled")
    dataToSend.encryptedStrings = responses[3].value.response;
  else {
    if (responses?.[3]?.reason?.code === NetworkResponse.NOT_FOUND.code)
      dataToSend.encryptedStrings = [];
    else
      dataToSend.error = {
        errorOccuredAt: "encryptedString",
        error: responses?.[3]?.reason,
      };
  }

  return new Resolve({ ...NetworkResponse.SUCCESS, response: dataToSend });
};

export const fetchCachedData = async (
  userId: string,
  meta: {
    roomLatestTimestamp?: string;
    messageLatestTimestamp?: string;
    requiredFeilds?: (
      | "roomsData"
      | "messages"
      | "notifications"
      | "encryptedStrings"
    )[];
  },
  db: Pool
) => {
  const client = await db.connect();
  try {
    if (meta?.requiredFeilds?.length) {
      const responses = await Promise.allSettled([
        ...(meta.requiredFeilds.includes("roomsData")
          ? [fetchRoomsForUser(userId, meta?.roomLatestTimestamp || "", db)]
          : []),
        ...(meta.requiredFeilds.includes("messages")
          ? [
              fetchMessagesForUser(
                userId,
                meta?.messageLatestTimestamp || "",
                client
              ),
            ]
          : []),
        ...(meta.requiredFeilds.includes("notifications")
          ? [fetchNotificationsForUser(userId, client)]
          : []),
        ...(meta.requiredFeilds.includes("encryptedStrings")
          ? [
              fetchEncryptedStringForUser(
                userId,
                meta?.messageLatestTimestamp || "",
                client
              ),
            ]
          : []),
      ]);
      return onAllSettled(responses);
    } else {
      const responses = await Promise.allSettled([
        fetchRoomsForUser(userId, meta?.roomLatestTimestamp || "", db),
        fetchMessagesForUser(
          userId,
          meta?.messageLatestTimestamp || "",
          client
        ),
        fetchNotificationsForUser(userId, client),
        fetchEncryptedStringForUser(
          userId,
          meta?.messageLatestTimestamp || "",
          client
        ),
      ]);
      return onAllSettled(responses);
    }
  } catch (e) {
    if (e instanceof Reject) throw e;
    else
      throw new Reject({
        ...NetworkResponse.INTERNAL_ERROR,
        reason: JSON.stringify(e),
      });
  } finally {
    client.release();
  }
};
