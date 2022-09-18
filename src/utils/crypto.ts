import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "crypto";

import { ENVs } from "../constants";

export const aesEncryptData = (string: string) => {
  if (!!string) {
    const aesIV = randomBytes(12);
    if (ENVs.ENCRYPT_KEY) {
      const cipher = createCipheriv("aes-256-gcm", ENVs.ENCRYPT_KEY, aesIV);
      return {
        res: Buffer.concat([
          aesIV,
          Buffer.concat([cipher.update(string), cipher.final()]),
          cipher.getAuthTag(),
        ]).toString("base64url"),
      };
    } else {
      return { error: "Unable to find encryption key.", res: string };
    }
  } else {
    return { error: "Empty String not accepted.", res: string };
  }
};

export const bulkAesEncrypt = (object: any) => {
  if (ENVs.ENCRYPT_KEY) {
    const res: any = {};
    Object.keys(object).forEach(async (ele: string) => {
      res[ele] = aesEncryptData(object[ele]).res;
    });
    return res;
  } else {
    return { error: "Unable to find encryption key." };
  }
};

export const aesDecryptData = (encryptedString: string) => {
  if (!!encryptedString) {
    const buffer = Buffer.from(encryptedString, "base64url");
    if (ENVs.ENCRYPT_KEY) {
      const cipher = createDecipheriv(
        "aes-256-gcm",
        ENVs.ENCRYPT_KEY,
        buffer.slice(0, 12)
      );
      cipher.setAuthTag(buffer.slice(-16));
      return {
        res:
          cipher.update(buffer.slice(12, -16)).toString() +
          cipher.final().toString(),
      };
    } else {
      return { error: "Unable to find encryption key.", res: encryptedString };
    }
  } else {
    return {
      error: "Empty encryptedString not accepted.",
      res: encryptedString,
    };
  }
};

export const bulkAesDecrypt = (object: any) => {
  if (ENVs.ENCRYPT_KEY) {
    const res: any = {};
    Object.keys(object).forEach(async (ele: string) => {
      res[ele] = aesDecryptData(object[ele]).res;
    });
    return res;
  } else {
    return { error: "Unable to find encryption key." };
  }
};

export const hashData = (string: string) => {
  if (!!string) {
    if (ENVs.HASH_KEY) {
      const hashedData = createHmac("md5", ENVs.HASH_KEY)
        .update(string)
        .digest("base64url");
      return { res: hashedData };
    } else {
      return { error: "Unable to find encryption key.", res: string };
    }
  } else {
    return { error: "Empty String not accepted.", res: string };
  }
};
