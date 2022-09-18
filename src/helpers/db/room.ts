import { randomUUID } from "crypto";
import { Pool } from "pg";

import {
  DBFunctionNames,
  ENVs,
  NetworkResponse,
  RoomTypes,
  RoomUserTypes,
  TableNames,
} from "../../constants";
import { Reject, Resolve } from "../../utils";
import { beginTransaction, PGP_DecryptField, PGP_EncryptField } from "./utils";

export const fetchRoomsForUser = async (
  userId: string,
  timestamp: string,
  db: Pool
) => {
  const client = await db.connect();
  try {
    await client.query(
      `BEGIN; SELECT ${DBFunctionNames.FETCH_ROOMS_AND_USERS}('${userId}','${
        ENVs.SECRET
      }', ${timestamp ? `'${timestamp}'` : null}, 'Ref1', 'Ref2')`
    );
    const ref1 = await client.query('FETCH ALL IN "Ref1"');
    const ref2 = await client.query('FETCH ALL IN "Ref2"; COMMIT;');
    await client.release();

    return new Resolve({
      ...NetworkResponse.SUCCESS,
      response: {
        roomUsers: ref1.rows,
        rooms: ref2.rows,
      },
    });
  } catch (error) {
    await client.release();
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: JSON.stringify(error),
    });
  }
};

export const createDuetRoomIfNotExists = async (
  createrUserId: string,
  otherUserId: string,
  db: Pool
) => {
  try {
    const query1 = `SELECT
                      r2.* 
                    FROM 
                      ${TableNames.ROOM_USERS} r1
                    JOIN 
                      ${TableNames.ROOM_USERS} r2
                    ON 
                      r1."roomId" = r2."roomId"
                    AND 
                      r1."userId" <> r2."userId"
                    AND 
                      r1."userId" = '${createrUserId}'
                    AND 
                      r2."userId" = '${otherUserId}'
                    AND 
                      r1."userRole" IN ('${RoomUserTypes.DUET_CREATOR}', '${RoomUserTypes.DUET_NORMAL}')
                    AND
                      r2."userRole" IN ('${RoomUserTypes.DUET_CREATOR}', '${RoomUserTypes.DUET_NORMAL}')
                    `;
    const result = await db.query(query1);

    if (result.rowCount == 0) {
      const roomId = randomUUID();
      const currentTime = Date.now().toString();
      const query2 = `WITH temp_result AS (
								INSERT INTO ${TableNames.ROOMS}(
									"roomId",
									"roomType",
									"createdByUserId",
									"createdAt",
									"updatedAt"
								) VALUES (
									'${roomId}',
									'${RoomTypes.DUET}',
									'${createrUserId}',
									'${currentTime}',
									'${currentTime}'
								) RETURNING *
							) INSERT INTO
								${TableNames.ROOM_USERS}(
									"roomId",
									"userId",
									"userRole",
									"joinedAt"
								) VALUES (
									(SELECT "roomId" FROM temp_result),
									'${createrUserId}',
									'${RoomUserTypes.DUET_CREATOR}',
									'${currentTime}'
								), (
									(SELECT "roomId" FROM temp_result),
									'${otherUserId}',
									'${RoomUserTypes.DUET_NORMAL}',
									'${currentTime}'
								) RETURNING *`;

      const transaction = Promise.all([db.query(query2)]);

      const result3 = await beginTransaction(transaction, db);
      if (result3 && result3?.[0]?.rowCount > 0)
        return new Resolve({
          ...NetworkResponse.SUCCESS,
          response: {
            room: {
              roomId,
              roomName: "",
              createdAt: currentTime,
              updatedAt: currentTime,
              createdByUserId: createrUserId,
              roomType: RoomTypes.DUET,
            },
          },
        });
      else
        throw new Reject({
          ...NetworkResponse.NO_UPDATE,
          reason: "Not inserted",
        });
    } else return await fetchRoom(result?.rows?.[0].roomId, db);
  } catch (error) {
    throw new Reject({ ...NetworkResponse.INTERNAL_ERROR, reason: error });
  }
};

export const createGroupRoom = async (
  createrUserId: string,
  otherUserIds: string[],
  roomName: string,
  db: Pool
) => {
  try {
    const roomId = randomUUID();
    const currentTime = Date.now().toString();
    const query = `WITH temp_result AS (
								INSERT INTO ${TableNames.ROOMS}(
									"roomId",
									"roomType",
                  "roomName",
									"createdByUserId",
									"createdAt",
									"updatedAt"
								) VALUES (
									'${roomId}',
									'${RoomTypes.GROUP}',
                  '${PGP_EncryptField(roomName)}',
									'${createrUserId}',
									'${currentTime}',
									'${currentTime}'
								) RETURNING *
							) INSERT INTO
								${TableNames.ROOM_USERS}(
									"roomId",
									"userId",
									"userRole",
									"joinedAt"
								) VALUES (
									(SELECT "roomId" FROM temp_result),
									'${createrUserId}',
									'${RoomUserTypes.GROUP_CREATOR}',
									'${currentTime}'
								), 
									${otherUserIds.map(
                    (id, index) => `(
                      (SELECT "roomId" FROM temp_result),
                      '${id}',
                      '${RoomUserTypes.GROUP_NORMAL}',
                      '${currentTime}'
                    ) ${index !== otherUserIds.length - 1 ? "" : ", "}`
                  )}'
								RETURNING *`;
    const transaction = Promise.all([db.query(query)]);

    const result = await beginTransaction(transaction, db);
    if (result && result?.[0]?.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: {
          room: {
            roomId,
            roomName,
            createdAt: currentTime,
            updatedAt: currentTime,
            createdByUserId: createrUserId,
            roomType: RoomTypes.GROUP,
          },
        },
      });
    else
      throw new Reject({
        ...NetworkResponse.NO_UPDATE,
        reason: "Not inserted",
      });
  } catch (error) {
    throw new Reject({ ...NetworkResponse.INTERNAL_ERROR, reason: error });
  }
};

export const fetchRoom = async (roomId: string, db: Pool) => {
  try {
    const query = `SELECT 
											"roomId",
                      ${PGP_DecryptField("roomName")},
                      ${PGP_DecryptField("roomLogo")},
                      ${PGP_DecryptField("roomDescription")},
                      "createdAt",
                      "updatedAt",
                      "createdByUserId",
                      "roomType"
										FROM 
											${TableNames.ROOMS}
										WHERE
											"roomId" = '${roomId}'`;
    const result = await db.query(query);
    if (result.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.NO_UPDATE,
        message: "No room Inserted",
        response: {
          room: result.rows[0],
        },
      });
    else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "room not availbale corresponding to given roomId",
      });
  } catch (error) {
    throw new Reject({ ...NetworkResponse.INTERNAL_ERROR, reason: error });
  }
};
