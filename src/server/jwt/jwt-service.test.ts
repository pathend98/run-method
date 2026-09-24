import { DefaultJwtService } from "./jwt-service";

const service = new DefaultJwtService();

function unsignedJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const claims = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${claims}.not-a-valid-signature`;
}

test("decodes JWT payload claims", () => {
  const claims = {
    iss: "https://identity.example.com",
    sub: "runner-123",
    aud: "run-method",
    email: "runner@example.com",
  };

  expect(service.decodeJwt(unsignedJwt(claims))).toEqual(claims);
});

test("rejects malformed JWTs", () => {
  expect(() => service.decodeJwt("not-a-jwt")).toThrow();
});

test("decodes claims without verifying the signature or expiry", () => {
  const token = unsignedJwt({ sub: "runner-123", exp: 1 });

  expect(service.decodeJwt(token)).toEqual({ sub: "runner-123", exp: 1 });
});
