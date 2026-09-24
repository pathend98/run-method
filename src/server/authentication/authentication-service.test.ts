import { createHash } from "node:crypto";

import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "./authentication-errors";
import { DefaultAuthenticationService } from "./authentication-service";

const configuration = {
  authorizationEndpoint:
    "https://identity.example.com/oauth2/authorize?provider=example&scope=old",
  callbackUrl: "https://app.example.com/auth/callback",
  clientId: "run-method-web",
  tokenEndpoint: "https://identity.example.com/oauth2/token",
};

const jwtService = { verifyIdToken: vi.fn() };
const verifiedClaims = {
  iss: "https://identity.example.com",
  sub: "runner-123",
  email: "runner@example.com",
};

beforeEach(() => {
  jwtService.verifyIdToken.mockReset();
  jwtService.verifyIdToken.mockResolvedValue(verifiedClaims);
});

type Transaction = {
  codeVerifier: string;
  state: string;
  nonce: string;
};

function decodeTransaction(value: string): Transaction {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function encodeTransaction(transaction: Partial<Transaction>): string {
  return Buffer.from(JSON.stringify(transaction)).toString("base64url");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("creates an OIDC authorization redirect with PKCE", () => {
  const service = new DefaultAuthenticationService(configuration, jwtService);

  const result = service.createAuthorizationRedirect();
  const transaction = decodeTransaction(result.transactionCookieValue);
  const query = result.authorizationUrl.searchParams;

  expect(result.authorizationUrl.origin).toBe("https://identity.example.com");
  expect(result.authorizationUrl.pathname).toBe("/oauth2/authorize");
  expect(query.get("provider")).toBe("example");
  expect(query.get("response_type")).toBe("code");
  expect(query.get("client_id")).toBe("run-method-web");
  expect(query.get("redirect_uri")).toBe(
    "https://app.example.com/auth/callback",
  );
  expect(query.get("scope")).toBe("openid email profile");
  expect(query.get("state")).toBe(transaction.state);
  expect(query.get("nonce")).toBe(transaction.nonce);
  expect(query.get("code_challenge_method")).toBe("S256");
  expect(query.get("code_challenge")).toBe(
    createHash("sha256").update(transaction.codeVerifier).digest("base64url"),
  );
});

test("generates independent 256-bit base64url transaction values", () => {
  const service = new DefaultAuthenticationService(configuration, jwtService);

  const first = decodeTransaction(
    service.createAuthorizationRedirect().transactionCookieValue,
  );
  const second = decodeTransaction(
    service.createAuthorizationRedirect().transactionCookieValue,
  );
  const values = [
    first.codeVerifier,
    first.state,
    first.nonce,
    second.codeVerifier,
    second.state,
    second.nonce,
  ];

  expect(new Set(values)).toHaveLength(values.length);
  for (const value of values) {
    expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  }
});

test("exchanges an authorization code and returns verified identity and session tokens", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
        expires_in: 3600,
      }),
      { status: 200 },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  const service = new DefaultAuthenticationService(configuration, jwtService);
  const transactionCookieValue = encodeTransaction({
    codeVerifier: "code-verifier",
    state: "expected-state",
    nonce: "nonce",
  });

  const result = await service.exchangeAuthorizationCode({
    code: "authorization-code",
    state: "expected-state",
    transactionCookieValue,
  });

  expect(result).toEqual({
    issuer: verifiedClaims.iss,
    subject: verifiedClaims.sub,
    email: verifiedClaims.email,
    accessToken: "access-token",
    refreshToken: "refresh-token",
  });
  expect(jwtService.verifyIdToken).toHaveBeenCalledExactlyOnceWith(
    "id-token",
    "nonce",
  );
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://identity.example.com/oauth2/token");
  expect(init).toMatchObject({
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
  });
  expect((init.body as URLSearchParams).toString()).toBe(
    "grant_type=authorization_code&client_id=run-method-web&redirect_uri=https%3A%2F%2Fapp.example.com%2Fauth%2Fcallback&code=authorization-code&code_verifier=code-verifier",
  );
  expect((init.body as URLSearchParams).has("state")).toBe(false);
});

test("waits for ID token verification before returning tokens", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
      }),
    ),
  );
  const verification = Promise.withResolvers<object>();
  jwtService.verifyIdToken.mockReturnValue(verification.promise);
  const service = new DefaultAuthenticationService(configuration, jwtService);
  let completed = false;

  const exchange = validExchange(service).then((value) => {
    completed = true;
    return value;
  });

  await vi.waitFor(() => expect(jwtService.verifyIdToken).toHaveBeenCalled());
  expect(completed).toBe(false);

  verification.resolve(verifiedClaims);
  await expect(exchange).resolves.toMatchObject({
    issuer: verifiedClaims.iss,
    subject: verifiedClaims.sub,
  });
});

test.each([
  ["missing email", { ...verifiedClaims, email: undefined }],
  ["blank email", { ...verifiedClaims, email: "  " }],
  ["missing issuer", { ...verifiedClaims, iss: undefined }],
  ["missing subject", { ...verifiedClaims, sub: undefined }],
])("rejects verified claims with %s", async (_name, claims) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
      }),
    ),
  );
  jwtService.verifyIdToken.mockResolvedValue(claims);
  const service = new DefaultAuthenticationService(configuration, jwtService);

  await expect(validExchange(service)).rejects.toBeInstanceOf(
    AuthenticationIdTokenVerificationError,
  );
});

test("rejects an ID token that cannot be verified", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        access_token: "access-token",
        id_token: "id-token",
        refresh_token: "refresh-token",
      }),
    ),
  );
  jwtService.verifyIdToken.mockRejectedValue(new Error("Invalid signature"));
  const service = new DefaultAuthenticationService(configuration, jwtService);

  await expect(validExchange(service)).rejects.toBeInstanceOf(
    AuthenticationIdTokenVerificationError,
  );
});

test.each([
  ["missing code", "", "expected-state"],
  ["missing state", "authorization-code", ""],
  ["mismatched state", "authorization-code", "other-state"],
])(
  "rejects %s before contacting the token endpoint",
  async (_name, code, state) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const service = new DefaultAuthenticationService(configuration, jwtService);

    await expect(
      service.exchangeAuthorizationCode({
        code,
        state,
        transactionCookieValue: encodeTransaction({
          codeVerifier: "code-verifier",
          state: "expected-state",
          nonce: "nonce",
        }),
      }),
    ).rejects.toBeInstanceOf(AuthenticationCallbackError);
    expect(fetchMock).not.toHaveBeenCalled();
  },
);

test.each([
  ["unparseable", "not-json"],
  ["non-object", Buffer.from("null").toString("base64url")],
  ["missing verifier", encodeTransaction({ state: "state", nonce: "nonce" })],
  [
    "missing state",
    encodeTransaction({ codeVerifier: "verifier", nonce: "nonce" }),
  ],
  [
    "missing nonce",
    encodeTransaction({ codeVerifier: "verifier", state: "state" }),
  ],
])(
  "rejects an %s transaction cookie",
  async (_name, transactionCookieValue) => {
    const service = new DefaultAuthenticationService(configuration, jwtService);

    await expect(
      service.exchangeAuthorizationCode({
        code: "code",
        state: "state",
        transactionCookieValue,
      }),
    ).rejects.toBeInstanceOf(AuthenticationCallbackError);
  },
);

test("wraps token endpoint network failures", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  const service = new DefaultAuthenticationService(configuration, jwtService);

  await expect(validExchange(service)).rejects.toBeInstanceOf(
    AuthenticationTokenExchangeError,
  );
});

test("rejects an unsuccessful token endpoint response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 400 })),
  );
  const service = new DefaultAuthenticationService(configuration, jwtService);

  await expect(validExchange(service)).rejects.toBeInstanceOf(
    AuthenticationTokenExchangeError,
  );
});

test("rejects a non-JSON token endpoint response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })),
  );
  const service = new DefaultAuthenticationService(configuration, jwtService);

  await expect(validExchange(service)).rejects.toBeInstanceOf(
    AuthenticationTokenExchangeError,
  );
});

test.each([
  ["non-object", null],
  ["missing access token", { id_token: "id", refresh_token: "refresh" }],
  [
    "empty access token",
    { access_token: "", id_token: "id", refresh_token: "refresh" },
  ],
  ["missing ID token", { access_token: "access", refresh_token: "refresh" }],
  ["missing refresh token", { access_token: "access", id_token: "id" }],
])("rejects a token response with %s", async (_name, body) => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })),
  );
  const service = new DefaultAuthenticationService(configuration, jwtService);

  await expect(validExchange(service)).rejects.toBeInstanceOf(
    AuthenticationTokenExchangeError,
  );
});

function validExchange(service: DefaultAuthenticationService) {
  return service.exchangeAuthorizationCode({
    code: "code",
    state: "state",
    transactionCookieValue: encodeTransaction({
      codeVerifier: "verifier",
      state: "state",
      nonce: "nonce",
    }),
  });
}
