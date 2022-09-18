import { Router } from "express";

import { fetchRoomDetails, getAllUsers, getUser } from "../handlers";
import { validateAccess, validateUser } from "../middlewares";
import { RouteEndpoints } from "./routesEndpoints";

const app = Router();

app.use(validateAccess);

app.get(RouteEndpoints.details.rooms.roomId.endpoint, fetchRoomDetails);
app.get(RouteEndpoints.details.users.userId.endpoint, getUser);

app.use(validateUser);
app.get(RouteEndpoints.details.users.endpoint, getAllUsers);

export const detailsRouter = app;
