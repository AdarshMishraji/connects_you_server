import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import rateLimit from "express-rate-limit";

import {
  Configs,
  Constants,
  Middlewares,
  RouteEndpoints,
  Routes,
  Socket,
} from "./src";
import { NetworkResponse } from "./src/constants";
import { Reject } from "./src/utils";

const port: number | string = process.env.PORT || Constants.ENVs.PORT || 4000;
const app: Application = express();

app.use(Middlewares.setCustomHeaders);
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(rateLimit(Configs.rateLimitConfig));

app.use(Middlewares.setDBConnectionPool);
app.use(Middlewares.logRoute);

app.use(RouteEndpoints.auth.endpoint, Routes.authRouter);
app.use(RouteEndpoints.me.endpoint, Routes.meRouter);
app.use(RouteEndpoints.details.endpoint, Routes.detailsRouter);
app.use(RouteEndpoints.test.endpoint, Routes.testRoutes);

const server = app.listen(port, () => {
  console.log("Server running at: " + port + " " + new Date());
});

const io = Socket.initialiseSocket(server);

io.use(Middlewares.socketAuthorization);

io.on(Constants.SocketEvents.CONNECTION, (socket) =>
  Socket.socketConnection(socket, io)
);

app.all("*", (_, res) => {
  res.status(NetworkResponse.NOT_FOUND.code).json(
    new Reject({
      ...NetworkResponse.NOT_FOUND,
      reason: "Bhand ho gye ho kya?",
    })
  );
});

// ssh -R 80:localhost:4000 localhost.run
