export const DB_Response = {
	ERROR: {
		FOREIGN_KEY: { code: "23503", name: "foreign_key_violation" },
		UNIQUE_KEY: { code: "23505", name: "unique_violation" },
		TRANSACTION_ROLLBACK: { code: "40000", name: "transaction_rollback" },
	},
};
