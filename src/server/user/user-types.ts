export type UserIdentity = {
  issuer: string;
  subject: string;
};

export type CreateUser = UserIdentity & {
  email: string;
};

export type CreateUserSession = UserIdentity & {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

export type CreateUserSessionRecord = {
  userId: string;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  sessionKeyHash: string;
  expiresAt: Date;
};
