import { cleanEnv, EnvError, makeValidator } from "envalid";

export interface OidcEnvironment {
  authorizationUrl: string;
  clientId: string;
  callbackUrl: string;
  scopes: string;
}

const httpUrl = makeValidator<string>((input) => {
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    throw new EnvError("OIDC URL must be a valid absolute URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new EnvError("OIDC URL must use the http:// or https:// protocol");
  }

  return input;
});

const oidcScopes = makeValidator<string>((input) => {
  const scopes = input.trim().split(/\s+/);

  if (!scopes.includes("openid")) {
    throw new EnvError("OIDC_SCOPES must include openid");
  }

  return scopes.join(" ");
});

const nonEmptyString = makeValidator<string>((input) => {
  if (input.trim().length === 0) {
    throw new EnvError("OIDC value must not be empty");
  }

  return input;
});

export class OidcEnvironmentReader {
  read(): OidcEnvironment {
    const env = cleanEnv(
      process.env,
      {
        OIDC_AUTHORIZATION_URL: httpUrl({
          desc: "OpenID Connect authorization endpoint",
          example:
            "http://localhost:8080/realms/run-method/protocol/openid-connect/auth",
        }),
        OIDC_CLIENT_ID: nonEmptyString({
          desc: "OpenID Connect public client identifier",
          example: "run-method",
        }),
        OIDC_CALLBACK_URL: httpUrl({
          desc: "OpenID Connect callback URL",
          example: "http://localhost:3000/auth/callback",
        }),
        OIDC_SCOPES: oidcScopes({
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
}
