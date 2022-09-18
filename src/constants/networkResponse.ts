export const NetworkResponse = {
	SUCCESS: { code: 200, message: "Success" },
	NO_UPDATE: { code: 204, error: "No Update", message: "No Update" },
	PARTIAL_DATA: { code: 206, message: "Partial Data" },
	BAD_REQUEST: { code: 400, error: "Bad Request" },
	UNAUTHORIZED: { code: 401, error: "Unauthorized" },
	FORBIDDEN: { code: 403, error: "Forbidden" },
	NOT_FOUND: { code: 404, error: "Not Found" },
	NOT_ACCEPTED: { code: 406, error: "Not Accepted" },
	ALREADY_EXISTS: { code: 409, error: "Already Exists (conflict)" },
	INTERNAL_ERROR: { code: 500, error: "Internal Error" },
};
