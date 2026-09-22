import { EnvError, makeValidator } from "envalid";

export const oidcScopesValidator = makeValidator<string>((input) => {
  const scopes = input.trim().split(/\s+/);

  if (!scopes.includes("openid")) {
    throw new EnvError("OIDC_SCOPES must include openid");
  }

  return scopes.join(" ");
});
