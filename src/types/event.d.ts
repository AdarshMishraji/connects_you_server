export type UserJoinedIncomingDataType = {
	sync: {
		roomLatestTimestamp: string;
		messageLatestTimestamp: string;
	};
	roomIds?: string[];
};
