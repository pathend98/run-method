import { cleanEnv } from "envalid";
import { httpUrlValidator } from "./validators/http-url-validator";
import { nonEmptyStringValidator } from "./validators/non-empty-string-validator";
import { oidcScopesValidator } from "./validators/oidc-scopes-validator";

export type OidcEnvironment = {
  authorizationUrl: string;
  clientId: string;
  callbackUrl: string;
  scopes: string;
};

export function readOidcEnv(): OidcEnvironment {
  const env = cleanEnv(
    process.env,
    {
      OIDC_AUTHORIZATION_URL: httpUrlValidator({
        desc: "OpenID Connect authorization endpoint",
        example:
          "http://localhost:8080/realms/run-method/protocol/openid-connect/auth",
      }),
      OIDC_CLIENT_ID: nonEmptyStringValidator({
        desc: "OpenID Connect public client identifier",
        example: "run-method",
      }),
      OIDC_CALLBACK_URL: httpUrlValidator({
        desc: "OpenID Connect callback URL",
        example: "http://localhost:3000/auth/callback",
      }),
      OIDC_SCOPES: oidcScopesValidator({
        desc: "Space-separated OpenID Connect scopes",
        example: "openid email profile",
      }),
    },
    { reporter: null },
  );

  return {
    authorizationUrl: env.OIDC_AUTHORIZATION_URL,
    clientId: env.OIDC_CLIENT_ID,
    callbackUrl: env.OIDC_CALLBACK_URL,
    scopes: env.OIDC_SCOPES,
  };
}
