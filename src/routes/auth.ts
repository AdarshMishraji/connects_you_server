import { Router } from "express";

import { authenticate, refreshToken, signout } from "../handlers";
import {
  fetchUserAgent,
  trackUserGeoData,
  validateAccess,
  validateAuthToken,
  validateUser,
  validateUser_ignoreExpiration,
} from "../middlewares";
import { RouteEndpoints } from "./routesEndpoints";

const app = Router();

app.use(validateAccess);
app.use(RouteEndpoints.auth.signout.endpoint, validateUser);
app.use(RouteEndpoints.auth.updateFcmToken.endpoint, validateUser);
app.patch(RouteEndpoints.auth.signout.endpoint, signout);

app.use(trackUserGeoData, fetchUserAgent);

app.use(
  RouteEndpoints.auth.refreshToken.endpoint,
  validateUser_ignoreExpiration
);
app.patch(RouteEndpoints.auth.refreshToken.endpoint, refreshToken);

app.use(validateAuthToken);
app.post(RouteEndpoints.auth.authenticate.endpoint, authenticate);

export const authRouter = app;
