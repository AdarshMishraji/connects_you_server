import { Response } from "express";
import { NetworkResponse } from "../constants";

export * from "./calculations";
export * from "./client";
export * from "./crypto";
export * from "./geoData";

export class Reject {
  code;
  error;
  reason;

  constructor({
    code,
    error,
    reason,
  }: {
    code: number;
    error: string;
    reason?: any;
  }) {
    this.code = code;
    this.error = error;
    this.reason = reason;
  }
}

export class Resolve<T = any> {
  code;
  message;
  response;

  constructor({
    code,
    message,
    response,
  }: {
    code: number;
    message: string;
    response: T;
  }) {
    this.code = code;
    this.message = message;
    this.response = response;
  }
}

export class CustomError extends Error {
  message;
  errorData;
  constructor(
    message: string,
    data: { errorData: { error: string; code: number } }
  ) {
    super();
    this.message = message;
    this.errorData = data?.errorData;
  }
}

export const handleExceptions = (
  error: any,
  res: Response,
  networkResponseBody?: Reject
) => {
  if (error instanceof Reject) return res.status(error.code).json(error);
  if (error instanceof CustomError)
    return res
      .status(error.errorData.code)
      .json(new Reject({ reason: error.message, ...error.errorData }));
  if (networkResponseBody)
    return res.status(networkResponseBody.code).json(networkResponseBody);
  return res.status(NetworkResponse.INTERNAL_ERROR.code).json(
    new Reject({
      reason: JSON.stringify(error),
      ...NetworkResponse.INTERNAL_ERROR,
    })
  );
};
