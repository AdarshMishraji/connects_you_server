const SCHEMA = "public";

export const TableNames = {
  USERS: SCHEMA + "." + "users",
  USER_LOGIN_HISTORY: SCHEMA + "." + "user_login_history",
  USER_TOKEN_REFRESH_INFO: SCHEMA + "." + "user_token_refresh_info",
  NOTIFICATIONS: SCHEMA + "." + "notifications",
  MESSAGES: SCHEMA + "." + "messages",
  MESSAGE_SEEN_INFO: SCHEMA + "." + "message_seen_info",
  ROOMS: SCHEMA + "." + "rooms",
  ROOM_USERS: SCHEMA + "." + "room_users",
  END_TO_END_ENCRYPTED_KEYS: SCHEMA + "." + "end_to_end_encrypted_strings",
  MESSAGE_THREADS: SCHEMA + "." + "message_threads",
};

export const DBFunctionNames = {
  FETCH_ROOMS_AND_USERS: SCHEMA + "." + "fetch_rooms_and_users",
};
