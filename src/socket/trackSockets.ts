export class SocketTracker {
  private static _userSocketId: { [userId: string]: string } = {};

  static set userSocketId(data: { [userId: string]: string }) {
    Object.assign(SocketTracker._userSocketId, data);
  }

  static get userSocketId() {
    return SocketTracker._userSocketId;
  }
}
