import { cleanEnv } from "envalid";
import { nonEmptyStringValidator } from "./non-empty-string-validator";

function readValue(OIDC_VALUE: string) {
  return cleanEnv(
    { OIDC_VALUE },
    { OIDC_VALUE: nonEmptyStringValidator() },
    { reporter: null },
  ).OIDC_VALUE;
}

test("accepts a non-empty string without changing it", () => {
  expect(readValue(" run-method ")).toBe(" run-method ");
});

test("rejects a whitespace-only string", () => {
  expect(() => readValue("   ")).toThrow("OIDC value must not be empty");
});
