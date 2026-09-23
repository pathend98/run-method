import { cleanEnv, str, url } from "envalid";

export type AuthenticationEnv = {
  OIDC_AUTHORIZATION_ENDPOINT: string;
  OIDC_CALLBACK_URL: string;
  OIDC_CLIENT_ID: string;
  OIDC_TOKEN_ENDPOINT: string;
};

export function readAuthenticationEnv(): AuthenticationEnv {
  const env = cleanEnv(process.env, {
    OIDC_AUTHORIZATION_ENDPOINT: url({
      desc: "OIDC authorization endpoint",
      example:
        "http://localhost:8080/realms/run-method/protocol/openid-connect/auth",
    }),
    OIDC_CALLBACK_URL: url({
      desc: "Callback URL registered with the OIDC provider",
      example: "http://localhost:3000/auth/callback",
    }),
    OIDC_CLIENT_ID: str({
      desc: "Public OIDC client identifier",
      example: "run-method",
    }),
    OIDC_TOKEN_ENDPOINT: url({
      desc: "OIDC token endpoint",
      example:
        "http://localhost:8080/realms/run-method/protocol/openid-connect/token",
    }),
  });

  return {
    OIDC_AUTHORIZATION_ENDPOINT: env.OIDC_AUTHORIZATION_ENDPOINT,
    OIDC_CALLBACK_URL: env.OIDC_CALLBACK_URL,
    OIDC_CLIENT_ID: env.OIDC_CLIENT_ID,
    OIDC_TOKEN_ENDPOINT: env.OIDC_TOKEN_ENDPOINT,
  };
}
