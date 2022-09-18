import { Request, Response } from "express";
import { Pool } from "pg";
import { fetchUserData } from "../../helpers";

import { handleExceptions } from "../../utils";
import { fetchCachedData } from "../common";

export const getCachedData = async (_: Request, res: Response) => {
  try {
    const db: Pool = res.locals.db;
    const userId = res.locals.user?.userId;
    const response = await fetchCachedData(
      userId,
      { requiredFeilds: ["roomsData", "messages", "encryptedStrings"] },
      db
    );
    return res.status(response.code).json(response);
  } catch (error) {
    return handleExceptions(error, res);
  }
};

export const getAuthUser = async (_: Request, res: Response) => {
  try {
    const db: Pool = res.locals.db;
    const userId = res.locals.user.userId;
    const response = await fetchUserData(userId, db);
    return res.status(response.code).json(response);
  } catch (error) {
    return handleExceptions(error, res);
  }
};
