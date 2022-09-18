export const RouteEndpoints = {
  auth: {
    endpoint: "/auth",
    authenticate: {
      endpoint: "/authenticate",
    },
    signout: {
      endpoint: "/signout",
    },
    refreshToken: {
      endpoint: "/refresh_token",
    },
    updateFcmToken: {
      endpoint: "/update_fcm_token",
    },
  },
  details: {
    endpoint: "/details",
    rooms: {
      endpoint: "/rooms",
      roomId: {
        endpoint: "/rooms/:roomId",
      },
    },
    users: {
      endpoint: "/users",
      userId: {
        endpoint: "/users/:userId",
      },
    },
  },
  me: {
    endpoint: "/me",
    cachedData: {
      endpoint: "/cached_data",
    },
  },
  test: {
    endpoint: "/test",
  },
};
