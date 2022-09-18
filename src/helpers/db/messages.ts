import { randomUUID } from "crypto";
import { Pool, PoolClient } from "pg";

import { NetworkResponse, TableNames } from "../../constants";
import { MessageData } from "../../types";
import { Reject, Resolve } from "../../utils";
import { beginTransaction } from "./utils";

export const fetchMessagesForUser = async (
  userId: string,
  timestamp: string,
  db: Pool | PoolClient
) => {
  try {
    const query1 = `SELECT
							        *,
                      (
                        SELECT
                          JSON_AGG(res) AS "messageSeenInfo"
                        FROM
                        (
                          select
                            *
                          FROM
                            ${TableNames.MESSAGE_SEEN_INFO}
                          WHERE 
                            "messageId" = m1."messageId"
                        ) res
                      )
                		FROM
            				  ${TableNames.MESSAGES} m1
                		WHERE
                		  ("senderUserId" = '${userId}' OR "recieverUserId" = '${userId}')
                    AND 
                      "isVisible" = true 
                		${
                      timestamp
                        ? `AND ("sendAt" > '${timestamp}' OR "updatedAt" > '${timestamp}')`
                        : ""
                    }
                    ORDER BY "updatedAt" DESC`;

    const result1 = await db.query(query1);
    if (result1.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: {
          messages: result1.rows,
        },
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "No messages are made from this user",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const insertMessage = async (messageBody: MessageData, db: Pool) => {
  try {
    const query = `INSERT INTO
						${TableNames.MESSAGES}(
							"messageId",
							"messageText",
							"messageType",
							"senderUserId",
							"recieverUserId",
							"roomId",
							${messageBody.replyMessageId ? `"replyMessageId",` : ""}
							"sendAt",
							"updatedAt",
              ${messageBody.belongsToThreadId ? `"belongsToThreadId"` : ""}
						) VALUES(
							'${messageBody.messageId}',
							'${messageBody.messageText}',
							'${messageBody.messageType}',
							'${messageBody.senderUserId}',
							'${messageBody.recieverUserId}',
							'${messageBody.roomId}',
							${messageBody.replyMessageId ? `'${messageBody.replyMessageId}',` : ""}
							'${messageBody.sendAt}',
							'${messageBody.updatedAt}',
							${messageBody.belongsToThreadId ? `'${messageBody.belongsToThreadId}'` : ""}
						) ON CONFLICT ("messageId") DO NOTHING
					`;

    const insertPromise = Promise.all([db.query(query)]);

    const result = await beginTransaction(insertPromise, db);
    if (result && result?.[0]?.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: messageBody,
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "Message not inserted",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const deleteMessages = async (
  messageIds: string[],
  myUserId: string,
  roomId: string,
  db: Pool
) => {
  try {
    const query = `UPDATE 
                    ${TableNames.MESSAGES}
                    SET "isVisible" = false
                   WHERE
                    "messageId"
                   IN
                    (${messageIds?.map((id) => `'${id}'`)})
                   AND
                    "senderUserId" = '${myUserId}'
                   AND
                    "roomId" = '${roomId}'
                   RETURNING "messageId"`;

    const deletePromise = Promise.all([db.query(query)]);

    const result = await beginTransaction(deletePromise, db, (result) => {
      return result?.[0]?.rowCount === messageIds?.length;
    });
    if (result && result?.[0]?.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: { messageIds: result?.[0].rows },
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "Message not deleted",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

// editing message is only allowed for the messages that are of "text" type
export const updateMessage = async (
  messageId: string,
  newMessageText: string,
  db: Pool
) => {
  try {
    const query = `UPDATE 
                      ${TableNames.MESSAGES} 
                    SET 
                      "messageText" = '${newMessageText}',
                      "updatedAt" = '${Date.now()}'
                    WHERE 
                      "messageId" = '${messageId}'
                    RETURNING "messageId"`;

    const transaction = Promise.all([db.query(query)]);
    const result = await beginTransaction(transaction, db);
    if (result && result?.[0]?.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: { messageId: result?.[0].rows?.[0]?.messageId },
      });
    else
      throw new Reject(
        new Reject({
          ...NetworkResponse.NOT_FOUND,
          reason: "Message not updated",
        })
      );
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const createMessageThread = async (
  messageId: string,
  createdByUserId: string,
  db: Pool
) => {
  const threadId = randomUUID();
  try {
    const query = `WITH temp as (
                      INSERT INTO 
                        ${TableNames.MESSAGE_THREADS} (
                          "threadId",
                          "messageId",
                          "createdAt",
                          "createdByUserId"
                        )
                        VALUES (
                          '${threadId}',
                          '${messageId}',
                          '${Date.now()}',
                          '${createdByUserId}'
                        ) RETURNING "threadId"
                    ) UPDATE 
                      ${TableNames.MESSAGES} 
                    SET 
                      "haveThreadId" = '${threadId}',
                    WHERE 
                      "messageId" = '${messageId}'
                    RETURNING "haveThreadId"`;
    const transaction = Promise.all([db.query(query)]);
    const result = await beginTransaction(transaction, db);
    if (result && result?.[0]?.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: { threadId: result?.[0].rows?.[0]?.haveThreadId },
      });
    else
      throw new Reject(
        new Reject({
          ...NetworkResponse.NOT_FOUND,
          reason: "Message not updated",
        })
      );
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const insertMessageSeenInfo = async (
  messageIds: string[],
  myUserId: string,
  time: string,
  db: Pool
) => {
  try {
    const query = `INSERT INTO
                    ${TableNames.MESSAGE_SEEN_INFO} (
                        "messageId",
                        "messageSeenByUserId",
                        "messageSeenAt"
                    ) VALUES
                      ${messageIds.map(
                        (id) => `('${id}', '${myUserId}', '${time}')`
                      )}
                      RETURNING "messageId"`;

    const deletePromise = Promise.all([db.query(query)]);

    const result = await beginTransaction(deletePromise, db, (result) => {
      return result?.[0]?.rowCount === messageIds?.length;
    });
    if (result && result?.[0]?.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: { messageIds: result?.[0].rows },
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "Message not deleted",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};
