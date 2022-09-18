export const SocketEvents = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  DISCONNECTING: "disconnecting",

  USER_JOINED_AFTER_AUTH: "user_joined_after_auth",
  USER_JOINED: "user_joined",
  USER_DISCONNECTED: "user_disconnected",
  CREATE_OR_JOIN_DUET_ROOM: "create_or_join_duet_room",
  CREATE_GROUP_ROOM: "create_group_room",
  ROOM_CREATED: "room_created",
  JOIN_ROOMID: "join_roomId",
  ROOM_MESSAGE: "room_message",
  USER_TYPING: "user_typing",
  DELETE_ROOM_MESSAGES: "delete_room_messages",
  ROOM_MESSAGE_SEEN: "room_message_seen",

  TOKEN_EXPIRED: "token_expired",
  USER_ACTIVE: "user_active",
  USER_INACTIVE: "user_inactive",
};
