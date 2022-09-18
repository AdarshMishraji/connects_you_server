import { ServerOptions } from "socket.io";

export const SocketConfig: Partial<ServerOptions> = {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
};
