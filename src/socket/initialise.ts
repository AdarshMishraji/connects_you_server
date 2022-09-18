import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

import { SocketConfig } from "../configs";

export const initialiseSocket = (server: HttpServer) => new SocketServer(server, SocketConfig);
