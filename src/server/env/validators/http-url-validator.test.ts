import { cleanEnv } from "envalid";
import { httpUrlValidator } from "./http-url-validator";

function readUrl(OIDC_URL: string) {
  return cleanEnv(
    { OIDC_URL },
    { OIDC_URL: httpUrlValidator() },
    { reporter: null },
  ).OIDC_URL;
}

test.each([
  "http://localhost:8080/authorize",
  "https://identity.example.com/authorize",
])("accepts HTTP(S) URLs: %s", (url) => {
  expect(readUrl(url)).toBe(url);
});

test("rejects malformed URLs", () => {
  expect(() => readUrl("not a URL")).toThrow(
    "OIDC URL must be a valid absolute URL",
  );
});

test("rejects URLs that do not use HTTP(S)", () => {
  expect(() => readUrl("ftp://identity.example.com/authorize")).toThrow(
    "OIDC URL must use the http:// or https:// protocol",
  );
});
