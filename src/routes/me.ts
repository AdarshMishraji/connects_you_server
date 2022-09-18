import { Router } from "express";

import { getAuthUser, getCachedData } from "../handlers";
import { validateAccess, validateUser } from "../middlewares";
import { RouteEndpoints } from "./routesEndpoints";

const app = Router();

app.use(validateAccess, validateUser);

app.use("/", getAuthUser);
app.get(RouteEndpoints.me.cachedData.endpoint, getCachedData);

export const meRouter = app;
