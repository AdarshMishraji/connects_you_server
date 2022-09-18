import { PoolConfig } from "pg";

import { ENVs } from "../constants";

export const DBConfig: PoolConfig = {
  connectionString: ENVs.DB_STRING,
};
