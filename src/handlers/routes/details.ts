import { Request, Response } from "express";
import { Pool } from "pg";
import { NetworkResponse } from "../../constants";

import { fetchAllUsers, fetchRoom, fetchUserData } from "../../helpers";
import { CustomError, handleExceptions } from "../../utils";

export const fetchRoomDetails = async (
  req: Request,
  res: Response,
  _: Function
) => {
  try {
    const roomId = req.params.roomId;
    if (roomId) {
      const db: Pool = res.locals.db;
      const response = await fetchRoom(roomId, db);
      return res.status(response.code).json(response);
    } else
      throw new CustomError("No roomId in request", {
        errorData: NetworkResponse.BAD_REQUEST,
      });
  } catch (error) {
    return handleExceptions(error, res);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db: Pool = res.locals.db;
    const userId = res.locals.user?.userId;
    const { pageSize, skip } = req.query;
    const response = await fetchAllUsers(
      userId,
      parseInt(pageSize?.toString() || ""),
      parseInt(skip?.toString() || ""),
      db
    );
    return res.status(response.code).json(response);
  } catch (error) {
    return handleExceptions(error, res);
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const db: Pool = res.locals.db;
    const userId = req.params.userId;
    const response = await fetchUserData(userId, db);
    return res.status(response.code).json(response);
  } catch (error) {
    return handleExceptions(error, res);
  }
};
