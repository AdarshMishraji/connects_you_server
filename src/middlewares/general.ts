import { Request, Response } from "express";

import { DBConnectionPool } from "../database";

export const logRoute = (req: Request, res: Response, next: Function) => {
  console.log("method->>>", req.method, "route->>>", req.path);
  next();
};

export const setCustomHeaders = (
  req: Request,
  res: Response,
  next: Function
) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
};

export const setDBConnectionPool = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (!res.locals.db) {
    res.locals.db = DBConnectionPool.instance;
  }
  next();
};
