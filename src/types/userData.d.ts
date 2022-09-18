export type UserData = {
  geoData: string;
  userAgent: string;
  name: string;
  photo: string;
  email: string;
  emailVerified: string;
  emailHash: string;
  publicKey: string;
  userId: string;
  locale: string;
  authProvider: string;
  fcmToken: string;
  loginId: string;
  description?: string;
};

export type UserResponse = {
  user: {
    userId: string;
    name: string;
    email: string;
    photo: string;
    publicKey: string;
    description?: string;
  };
};

export type LoginSuccess = {
  method: string;
  userPrevData?: {
    userId: string;
    publicKey: string;
  };
};
