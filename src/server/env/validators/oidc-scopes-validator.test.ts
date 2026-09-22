import { cleanEnv } from "envalid";
import { oidcScopesValidator } from "./oidc-scopes-validator";

function readScopes(OIDC_SCOPES: string) {
  return cleanEnv(
    { OIDC_SCOPES },
    { OIDC_SCOPES: oidcScopesValidator() },
    { reporter: null },
  ).OIDC_SCOPES;
}

test("normalizes whitespace in scopes containing openid", () => {
  expect(readScopes("  profile   openid  email ")).toBe("profile openid email");
});

test("rejects scopes without openid", () => {
  expect(() => readScopes("email profile")).toThrow(
    "OIDC_SCOPES must include openid",
  );
});
