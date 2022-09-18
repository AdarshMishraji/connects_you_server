import { Request, Response } from "express";

import { fetchGeoData } from "../utils";

export const trackUserGeoData = async (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    const ip = req.ip;
    const geoData = await fetchGeoData(ip);
    if (geoData) {
      res.locals.geoData = geoData;
      res.locals.ip = ip;
      next();
    }
  } catch (e) {
    next();
  }
};

export const fetchUserAgent = (req: Request, res: Response, next: Function) => {
  const userAgent = req.header("user-agent");
  res.locals.userAgent = userAgent;
  next();
};
