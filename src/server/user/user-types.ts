export type UserIdentity = {
  issuer: string;
  subject: string;
};

export type CreateUser = UserIdentity & {
  email: string;
};

export type CreateUserSession = UserIdentity & {
  accessToken: string;
  refreshToken: string;
};

export type CreateUserSessionRecord = CreateUserSession & {
  sessionKeyHash: string;
  expiresAt: Date;
};
