import { generateKeyPairSync } from "node:crypto";
import { exportJWK, SignJWT } from "jose";
import type { JWTPayload } from "jose";

import { DefaultJwtService } from "./jwt-service";

const issuer = "https://identity.example.com";
const audience = "run-method";
const nonce = "authorization-nonce";
const jwksUrl = `${issuer}/certs`;
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const otherPrivateKey = generateKeyPairSync("rsa", {
  modulusLength: 2048,
}).privateKey;

function claims(): JWTPayload {
  return {
    iss: issuer,
    sub: "runner-123",
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    nonce,
    email: "runner@example.com",
  };
}

async function sign(
  payload: JWTPayload,
  key: typeof privateKey = privateKey,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .sign(key);
}

beforeEach(async () => {
  const jwk = { ...(await exportJWK(publicKey)), kid: "test-key" };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ keys: [jwk] })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function service(): DefaultJwtService {
  return new DefaultJwtService({ jwksUrl, issuer, audience });
}

test("returns claims only after verifying a signed ID token", async () => {
  const payload = { ...claims(), azp: audience };

  await expect(
    service().verifyIdToken(await sign(payload), nonce),
  ).resolves.toEqual(payload);
  expect(fetch).toHaveBeenCalledWith(
    jwksUrl,
    expect.objectContaining({ method: "GET" }),
  );
});

test("reuses the fetched JWKS for later verifications", async () => {
  const verifier = service();
  const payload = claims();
  const token = await sign(payload);

  await expect(verifier.verifyIdToken(token, nonce)).resolves.toEqual(payload);
  await expect(verifier.verifyIdToken(token, nonce)).resolves.toEqual(payload);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("rejects an invalid signature", async () => {
  await expect(
    service().verifyIdToken(await sign(claims(), otherPrivateKey), nonce),
  ).rejects.toThrow();
});

test("rejects a malformed token", async () => {
  await expect(service().verifyIdToken("not-a-jwt", nonce)).rejects.toThrow();
});

test.each([
  ["issuer", { iss: "https://other.example.com" }],
  ["audience", { aud: "other-client" }],
  ["expiry", { exp: 1 }],
  ["authorized party", { azp: "other-client" }],
  ["nonce", { nonce: "other-nonce" }],
])("rejects a token with the wrong %s", async (_name, override) => {
  await expect(
    service().verifyIdToken(await sign({ ...claims(), ...override }), nonce),
  ).rejects.toThrow();
});

test.each(["sub", "exp", "iat", "nonce"])(
  "rejects a token without %s",
  async (claim) => {
    const payload = claims();
    delete payload[claim];

    await expect(
      service().verifyIdToken(await sign(payload), nonce),
    ).rejects.toThrow();
  },
);

test("rejects an empty expected nonce", async () => {
  await expect(
    service().verifyIdToken(await sign(claims()), ""),
  ).rejects.toThrow("Invalid ID token nonce");
});
