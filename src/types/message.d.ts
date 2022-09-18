export interface MessageSeenInfoIdType {
  messageId: string;
  messageSeenByUserId?: string;
  messageSeenAt?: string;
}
export interface MessageData extends MessageSeenInfoIdType {
  messageId: string;
  messageText: string;
  messageType: string;
  senderUserId: string;
  recieverUserId?: string;
  roomId: string;
  replyMessageId: string;
  sendAt: string;
  updatedAt: string;
  expressionList?: string;
  haveThreadId?: string;
  belongsToThreadId?: string;
}
