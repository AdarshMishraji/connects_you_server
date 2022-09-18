import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { decode } from "jsonwebtoken";
import { Pool } from "pg";
import { Socket } from "socket.io";

import { ENVs, NetworkResponse } from "../constants";
import { DBConnectionPool } from "../database";
import { fetchLoginInfoOfUser, fetchUserData } from "../helpers";
import {
  CustomError,
  handleExceptions,
  Reject,
  verifyAndDecodeJWT,
} from "../utils";

export const __validateUserHelper = async (
  req: Request,
  res: Response,
  next: NextFunction,
  ignoreExpiration: boolean
) => {
  try {
    const { token } = req.headers;
    if (token) {
      const [bearer, actualToken] = token.toString().split(" ");
      if (bearer === "Bearer") {
        const tokenResponse: any = verifyAndDecodeJWT(
          actualToken,
          ignoreExpiration
        );
        if (tokenResponse.TokenExpiredError)
          throw new CustomError("Token Expired.", {
            errorData: NetworkResponse.UNAUTHORIZED,
          });
        if (tokenResponse.result) {
          const db: Pool = res.locals.db;
          if (db) {
            const result = await fetchLoginInfoOfUser(
              tokenResponse.result.userId,
              tokenResponse.result.loginId,
              true,
              db
            );
            if (result) {
              res.locals.user = tokenResponse.result;
              return next();
            }
          } else
            throw new CustomError("db object undefined", {
              errorData: NetworkResponse.INTERNAL_ERROR,
            });
        } else
          throw new CustomError("Invalid User.", {
            errorData: NetworkResponse.BAD_REQUEST,
          });
      } else
        throw new CustomError("Invalid Token.", {
          errorData: NetworkResponse.NOT_ACCEPTED,
        });
    } else
      throw new CustomError("Token in undefined.", {
        errorData: NetworkResponse.NOT_ACCEPTED,
      });
  } catch (error) {
    return handleExceptions(
      error,
      res,
      new Reject({
        reason: JSON.stringify(error),
        ...NetworkResponse.NOT_ACCEPTED,
      })
    );
  }
};

export const validateAuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token } = req.body;
  try {
    const client = new OAuth2Client(ENVs.GOOGLE_CLIENT_ID);
    if (token) {
      if (ENVs.ENV_MODE === "dev") {
        const user = decode(token);
        res.locals.user = user;
        next();
      } else {
        const response = await client.verifyIdToken({ idToken: token });
        if (response) {
          const user = response.getPayload();
          res.locals.user = user;
          next();
        }
      }
    } else
      throw new CustomError("Token not exists", {
        errorData: NetworkResponse.NOT_ACCEPTED,
      });
  } catch (error) {
    console.log(error);
    return handleExceptions(
      error,
      res,
      new Reject({
        reason: "Invalid User",
        ...NetworkResponse.NOT_ACCEPTED,
      })
    );
  }
};

export const validateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  __validateUserHelper(req, res, next, false);
};

export const validateUser_ignoreExpiration = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  __validateUserHelper(req, res, next, true);
};

export const validateAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const api_key = req.headers["api-key"];
  if (api_key === ENVs.API_KEY || ENVs.ENV_MODE === "dev") next();
  else
    return res.status(NetworkResponse.FORBIDDEN.code).json({
      reason: "Authorization Failed. (API_KEY missing)",
      ...NetworkResponse.FORBIDDEN,
    });
};

export const socketAuthorization = async (socket: Socket, next: Function) => {
  let { token, key } = socket.handshake.auth;
  token = token && token.split(" ")?.[1];
  const tokenUser = token ? verifyAndDecodeJWT(token, false) : undefined;
  if (
    (ENVs.ENV_MODE === "dev" || key === ENVs.API_KEY) &&
    !tokenUser?.TokenExpiredError &&
    tokenUser?.result &&
    tokenUser?.result?.userId
  ) {
    const db: Pool = DBConnectionPool.instance;
    try {
      const userDetails = (await fetchUserData(tokenUser.result.userId, db))
        ?.response?.user;
      socket.data.db = db;
      if (userDetails) {
        socket.data.userDetails = userDetails;
        next();
      } else
        throw new CustomError("Unable to retrive user details", {
          errorData: NetworkResponse.BAD_REQUEST,
        });
    } catch (error) {
      console.log("socket auth", error);
      next(error);
    }
  } else {
    next(
      new CustomError("User unauthorized", {
        errorData: NetworkResponse.UNAUTHORIZED,
      })
    );
  }
};
