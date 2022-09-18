import { Pool, PoolClient, QueryResult } from "pg";

import {
  AuthenticationTypes,
  NetworkResponse,
  TableNames,
} from "../../constants";
import { UserData } from "../../types";
import { CustomError, Reject, Resolve } from "../../utils";
import {
  beginTransaction,
  commit,
  PGP_DecryptField,
  PGP_EncryptField,
  rollback,
} from "./utils";

export const fetchUserData = async (userId: string, db: Pool) => {
  try {
    const query1 = `SELECT
               "userId",
               ${PGP_DecryptField("name")},
               ${PGP_DecryptField("email")},
               ${PGP_DecryptField("photo")},
               ${PGP_DecryptField("publicKey")},
               ${PGP_DecryptField("description")},
               "isOnline"
						FROM
							${TableNames.USERS}
						WHERE
							"userId" = '${userId}'`;

    const result: QueryResult<Partial<UserData>> = await db.query(query1);
    if (result.rowCount > 0) {
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: {
          user: result.rows[0],
        },
      });
    } else
      throw new CustomError("User not found", {
        errorData: NetworkResponse.NOT_FOUND,
      });
  } catch (error) {
    if (error instanceof CustomError)
      throw new Reject({
        ...error.errorData,
        reason: error.message,
      });
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

const updateUserLoginData = async (userData: UserData, client: PoolClient) => {
  try {
    const currentDate = Date.now();

    const query1 = `WITH temp as (
                          INSERT 
                              INTO
                          ${TableNames.USER_LOGIN_HISTORY}(
									            "userId",
                              "geoData",
                              "userAgent",
                              "loggedInAt",
                              "loginId",
                              "isValid"
                          ) VALUES (
									            '${userData.userId}',
                              ${PGP_EncryptField(userData.geoData)},
                              ${PGP_EncryptField(userData.userAgent)},
                              '${currentDate}',
                              '${userData.loginId}',
                              true
                          ) RETURNING "userId"
                        ) UPDATE
                              ${TableNames.USERS}
                          SET
								              "fcmToken" = ${PGP_EncryptField(userData.fcmToken)}
							            WHERE
								              "userId" = '${userData.userId}'
                      `;

    const result = await client.query(query1);

    if (result.rowCount > 0) {
      await commit(client);
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: {
          method: AuthenticationTypes.LOGIN,
          userPrevData: {
            publicKey: userData.publicKey, // as we are login the user, so we have to send the stored publicKey, and userId as a response;
            userId: userData.userId,
          },
        },
      });
    } else {
      await rollback(client);
      throw new Reject({
        ...NetworkResponse.NO_UPDATE,
        reason: "User login info not updated",
      });
    }
  } catch (error) {
    await rollback(client);
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

const saveUserData = async (userData: UserData, client: PoolClient) => {
  try {
    const currentDate = Date.now();
    const query = `WITH temp_result AS (
			 					INSERT INTO
                  ${TableNames.USERS} (
                      "userId",
                      "name",
                      "email",
                      "emailHash",
                      "emailVerified",
                      "photo",
                      "authProvider",
                      "locale",
                      "publicKey",
                      "joinedAt",
                      "updatedAt",
                      "fcmToken"
                  ) VALUES (
                      '${userData.userId}',
                      ${PGP_EncryptField(userData.name)},
                      ${PGP_EncryptField(userData.email)},
                      '${userData.emailHash}',
                      ${userData.emailVerified},
                      ${PGP_EncryptField(userData.photo)},
                      '${userData.authProvider}',
                      '${userData.locale}',
                      ${PGP_EncryptField(userData.publicKey)},
                      '${currentDate}',
                      '${currentDate}',
                      ${PGP_EncryptField(userData.fcmToken)}
                  ) RETURNING "userId"
							) INSERT INTO
                  ${TableNames.USER_LOGIN_HISTORY} (
                    	"userId",
                    	"geoData",
                    	"userAgent",
                    	"loggedInAt",
                    	"loginId",
                    	"isValid"
                  ) VALUES (
                    	(SELECT "userId" FROM temp_result),
                    	${PGP_EncryptField(userData.geoData)},
                    	${PGP_EncryptField(userData.userAgent)},
                    	'${currentDate}',
                    	'${userData.loginId}',
                    	true
                  )`;

    const result = await client.query(query);

    if (result.rowCount > 0) {
      await commit(client);
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: { method: AuthenticationTypes.SIGNUP, userPrevData: null },
      });
    } else {
      await rollback(client);
      throw new Reject({
        ...NetworkResponse.NO_UPDATE,
        reason: "User not inserted",
      });
    }
  } catch (error) {
    await rollback(client);
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const checkAndUpdateUserData = async (userData: UserData, db: Pool) => {
  try {
    const client = await db.connect();
    const query = `SELECT
							"userId",
							${PGP_DecryptField("publicKey")}
						FROM
							${TableNames.USERS}
						WHERE
							"emailHash" = '${userData.emailHash}'`;

    const result = await client.query(query);
    await client.query("BEGIN");
    if (result.rows?.[0]?.userId) {
      return await updateUserLoginData(
        {
          ...userData,
          userId: result.rows?.[0]?.userId,
          publicKey: result.rows?.[0]?.publicKey,
        },
        client
      );
    } else {
      return await saveUserData(userData, client);
    }
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const makeLoginInfoInvalid = async (userId: string, db: Pool) => {
  try {
    const query = `UPDATE
								${TableNames.USER_LOGIN_HISTORY}
							SET
								"isValid" = false
							WHERE
								"userId" = '${userId}' 
								AND
								"isValid" = true
              RETURNING _id`;

    console.log(query);
    const updateUserLoginInfo = Promise.all([db.query(query)]);

    const result = await beginTransaction(updateUserLoginInfo, db);
    console.log(result);
    if (result && result?.[0]?.rowCount > 0) {
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result?.[0]?.rows?.[0]?._id,
      });
    } else {
      throw new Resolve({
        ...NetworkResponse.NO_UPDATE,
        response: "unable to make login info invalid",
      });
    }
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const fetchAllUsers = async (
  userId: string,
  pageSize: number = 10,
  skip: number = 0,
  db: Pool
) => {
  try {
    const query = `SELECT
							"userId",
							${PGP_DecryptField("name")},
							${PGP_DecryptField("email")},
							${PGP_DecryptField("photo")},
							${PGP_DecryptField("publicKey")},
							${PGP_DecryptField("description")},
							"isOnline"
						FROM
							${TableNames.USERS}
						WHERE
							"userId" NOT IN ('${userId}', 'ADMIN')
						${
              pageSize && skip
                ? `AND
							"_id" >= ${skip}
						LIMIT
							${pageSize}
						`
                : ""
            }`;
    const result = await db.query(query);
    if (result.rowCount > 0) {
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: {
          users: result.rows,
        },
      });
    } else
      throw new Reject({
        ...NetworkResponse.NOT_FOUND,
        reason: "No user found",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const setUserOnlineStatus = async (
  userId: string,
  status: boolean,
  db: Pool
) => {
  try {
    const query = `UPDATE 
							${TableNames.USERS} 
						SET
							"isOnline" = ${status}
						WHERE
							"userId" = '${userId}'
            RETURNING _id`;

    const updatePromise = Promise.all([db.query(query)]);

    const result = await beginTransaction(updatePromise, db);
    if (result && result?.[0]?.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: result?.[0]?.rows?.[0]?._id,
      });
    else
      return new Resolve({
        ...NetworkResponse.NO_UPDATE,
        response: "online status not updated",
      });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const fetchLoginInfoOfUser = async (
  userId: string,
  loginId: string,
  status: boolean,
  db: Pool
) => {
  try {
    const query = `SELECT
							"loginId",
              "userId",
              "loggedInAt",
              "isValid",
              ${PGP_DecryptField("geoData")},
              ${PGP_DecryptField("userAgent")}
						FROM
							${TableNames.USER_LOGIN_HISTORY}
						WHERE
							"userId" = '${userId}'
						AND
							"loginId" = '${loginId}'
						AND
							"isValid" = ${status}
					`;
    const result = await db.query(query);
    if (result.rowCount > 0)
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: {
          loginInfo: result.rows[0],
        },
      });
    else
      throw new Reject({ ...NetworkResponse.NOT_FOUND, reason: "Not found" });
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};

export const insertRefreshTokenInfo = async (
  loginId: string,
  geoData: string,
  userAgent: string,
  db: Pool
) => {
  try {
    const query = `INSERT INTO 
						${TableNames.USER_TOKEN_REFRESH_INFO} (
							"loginId",
							"refreshedAt",
							"geoData",
							"userAgent"
						) VALUES (
							'${loginId}',
							'${Date.now()}',
							${PGP_EncryptField(geoData)},
							${PGP_EncryptField(userAgent)}
						) RETURNING '_id'`;

    const transaction = Promise.all([db.query(query)]);

    const result = await beginTransaction(transaction, db);
    if (result && result?.[0]?.rowCount > 0) {
      return new Resolve({
        ...NetworkResponse.SUCCESS,
        response: { _id: result?.[0]?.rows[0]._id, message: "Inserted" },
      });
    } else {
      throw new Reject({
        ...NetworkResponse.NO_UPDATE,
        reason: "User not inserted",
      });
    }
  } catch (error) {
    throw new Reject({
      ...NetworkResponse.INTERNAL_ERROR,
      reason: error,
    });
  }
};
