import { Pool, PoolClient } from "pg";

import { NetworkResponse, TableNames } from "../../constants";
import { Reject, Resolve } from "../../utils";
import { beginTransaction, PGP_DecryptField } from "./utils";

export const fetchNotificationsForUser = async (
  userId: string,
  db: Pool | PoolClient
) => {
  try {
    const query = `SELECT
						 "notificationId",
                         "notificationType",
                         "fromUserId",
                         "toUserId",
                        "createdAt",
                        ${PGP_DecryptField("notificationText")},
                        ${PGP_DecryptField("extraData")}
            			FROM
            				${TableNames.NOTIFICATIONS}
            			WHERE
            				"toUserId" = '${userId}'`;
    const result = await db.query(query);
    if (result.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result,
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "No notifications are here for this user",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const deleteNotificationsForUser = async (userId: string, db: Pool) => {
  try {
    const query = `DELETE
		                FROM
		                    ${TableNames.NOTIFICATIONS}
		                WHERE
		                    "toUserId" = '${userId}'
                    RETURNING _id`;

    const deletePromise = Promise.all([db.query(query)]);

    const result = await beginTransaction(deletePromise, db);
    if (result && result?.[0].rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result?.[0]?.rows?.[0]?._id,
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "No notifications are here for this user",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};
