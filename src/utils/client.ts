import DeviceDetector from "device-detector-js";
import jwt, { TokenExpiredError } from "jsonwebtoken";

import { ENVs } from "../constants";

export const getClientData = (device: string) => {
  const device_data = new DeviceDetector().parse(device);
  const data = {
    clientType: device_data?.client?.type,
    clientName: device_data?.client?.name,
    OS: device_data?.os?.name,
    deviceType: device_data?.device?.type,
    deviceBrand: device_data?.device?.brand,
    isBot: device_data?.bot,
  };
  return data;
};

export const verifyAndDecodeJWT = (
  token: string,
  ignoreExpiration?: boolean
): { result?: any; TokenExpiredError?: TokenExpiredError } | null => {
  try {
    if (token && ENVs.SECRET)
      return {
        result: jwt.verify(token, ENVs.SECRET, {
          ignoreExpiration: ignoreExpiration ?? false,
        }),
      };
    return null;
  } catch (e: any) {
    if (e instanceof TokenExpiredError) return { TokenExpiredError: e };
    else return null;
  }
};
