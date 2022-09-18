import { randomUUID } from "crypto";
import { Pool, PoolClient } from "pg";

import { NetworkResponse, NotificationType, TableNames } from "../../constants";
import { Reject, Resolve } from "../../utils";
import { beginTransaction, PGP_DecryptField, PGP_EncryptField } from "./utils";

export const fetchEncryptedKeyFromNotifications = async (
  notificationId: string,
  db: Pool
) => {
  try {
    const query = `SELECT
                			${PGP_DecryptField("extraData")},
                      ${PGP_DecryptField("notificationText")},
                			"fromUserId",
                      "notificationType",
                      "createdAt"
                		FROM
                			${TableNames.NOTIFICATIONS}
                		WHERE
                			"notificationId" = '${notificationId}'
                		AND
                			"notificationType" = '${NotificationType.GROUP_INVITE}'`;
    const result = await db.query(query);
    if (result.rowCount > 0 && !!result.rows?.[0]?.extraData?.encryptedKey)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result,
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "No encrypted key are here for this notification id",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const insertGroupEncryptedKeyIntoNotifications = async (
  fromUserId: string,
  toUserId: string,
  notificationText: string,
  key: string,
  db: Pool
) => {
  try {
    const extraData = { key };

    const query = `INSERT INTO
                        ${TableNames.NOTIFICATIONS}(
                            "notificationId",
                            "fromUserId",
                            "toUserId",
                            "notificationText",
                            "extraData",
                            "notificationType",
                            "createdAt"
                        ) VALUES (
                            '${randomUUID()}',
                            '${fromUserId}',
                            '${toUserId}',
                            ${PGP_EncryptField(notificationText)},
                            ${PGP_EncryptField(JSON.stringify(extraData))},
                            '${NotificationType.GROUP_INVITE}',
                            '${Date.now()}'
                        ) RETURNING _id`;

    const insertPromise = Promise.all([db.query(query)]);

    const result = await beginTransaction(insertPromise, db);
    if (result && result[0].rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result?.[0]?.rows?.[0]?._id,
      });
    else
      throw new Reject(
        new Reject({
          ...NetworkResponse.NOT_FOUND,
          reason: "No notifications added",
        })
      );
  } catch (error) {
    throw new Reject(
      new Reject({
        ...NetworkResponse.INTERNAL_ERROR,
        reason: error,
      })
    );
  }
};

export const insertEncryptedString = async (
  senderUserId: string,
  recieverUserId: string,
  encryptedString: string,
  db: Pool
) => {
  try {
    const query = `INSERT INTO
                        ${TableNames.END_TO_END_ENCRYPTED_KEYS}(
                            "senderUserId",
                            "recieverUserId",
                            "encryptedString",
                            "createdAt"
                        ) VALUES (
                            '${senderUserId}',
                            '${recieverUserId}',
                            ${PGP_EncryptField(encryptedString)},
                            '${Date.now()}'
                        ) RETURNING _id`;

    const insertPromise = Promise.all([db.query(query)]);

    const result = await beginTransaction(insertPromise, db);
    if (result && result[0].rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result?.[0]?.rows?.[0]?._id,
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "No encrypted string added",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const fetchEncryptedStringForUser = async (
  userId: string,
  timestamp: string,
  db: Pool | PoolClient
) => {
  try {
    const query = `SELECT
              "senderUserId",
              "recieverUserId",
              ${PGP_DecryptField("encryptedString")},
              "createdAt"
						FROM
							${TableNames.END_TO_END_ENCRYPTED_KEYS}
						WHERE
							"recieverUserId" = '${userId}'
						${timestamp ? `AND "sendAt" > '${timestamp}'` : ""}	
						`;

    const result = await db.query(query);
    if (result.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result,
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "No encrypted string are here for this notification id",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};
