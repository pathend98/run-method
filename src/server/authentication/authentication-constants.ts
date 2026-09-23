export const OIDC_TRANSACTION_COOKIE_NAME = "__Host-oidc-transaction";
export const OIDC_TOKEN_COOKIE_NAME = "__Host-oidc-tokens";
export const OIDC_TRANSACTION_MAX_AGE_SECONDS = 10 * 60;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};
