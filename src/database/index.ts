import { Pool } from "pg";

import { DBConfig } from "../configs";

export class DBConnectionPool {
  private static _connectionPool: Pool;

  static get instance() {
    if (!DBConnectionPool._connectionPool)
      DBConnectionPool._connectionPool = new Pool(DBConfig);
    return DBConnectionPool._connectionPool;
  }
}
