import { Pool, PoolClient, QueryResult } from "pg";
import { ENVs } from "../../constants";

export class TransactionError extends Error {
  error = "";
  reason = "";
  constructor(error: any, reason?: any) {
    super();
    this.error = error;
    this.reason = reason;
  }
}

export const rollback = (client: PoolClient, thenError?: any) => {
  return client
    .query("ROLLBACK")
    .then(() => {
      throw new TransactionError("rollbacked", thenError);
    })
    .catch((error) => {
      throw new TransactionError("unable to rollback", error);
    });
};

export const commit = (client: PoolClient, result?: QueryResult<any>[]) => {
  return client
    .query("COMMIT")
    .then(() => result)
    .catch((error1) => {
      throw new TransactionError("commit failed", error1);
    });
};

export const beginTransaction = async (
  transaction: Promise<QueryResult<any>[]>,
  db: Pool,
  dataBeforeCommit?: (result: QueryResult<any>[]) => boolean
) => {
  const client = await db.connect();
  return client
    .query("BEGIN")
    .then(() => {
      return transaction
        .then((result) => {
          const shouldCommit = dataBeforeCommit?.(result) ?? true;
          if (shouldCommit) {
            return commit(client, result);
          } else {
            console.log("force rollbacked");
            return rollback(client, "force rollbacked");
          }
        })
        .catch((error1) => {
          console.log("transactiion failed", error1);
          throw new TransactionError("transaction failed", error1);
        })
        .finally(() => {
          client.release();
        });
    })
    .catch((error1) => {
      console.log("rollbacked", error1);
      return rollback(client, error1);
    });
};

export const PGP_EncryptField = (field: string, key = ENVs.ENCRYPT_KEY) => {
  const pgpConfigurations = "compress-algo=2, cipher-algo=aes256";
  return `PGP_SYM_ENCRYPT('${field}', '${key}', '${pgpConfigurations}')`;
};

export const PGP_DecryptField = (field: string, key = ENVs.ENCRYPT_KEY) => {
  const pgpConfigurations = "compress-algo=2, cipher-algo=aes256";
  return `PGP_SYM_DECRYPT("${field}"::bytea, '${key}', '${pgpConfigurations}') as "${field}"`;
};
