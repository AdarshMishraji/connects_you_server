export type RoomType = {
	roomId: string;
	roomName: string;
	roomType: string;
	createdByUserId: string;
	roomLogo?: string;
	createdAt: string;
	updatedAt: string;
	roomDescription?: string;
};

export type RoomUserType = {
	roomId: string;
	userId: string;
	userRole: string;
	joinedAt: string;
};
