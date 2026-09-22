import { GET } from "./route";

const loginService = vi.hoisted(() => ({
  createLogin: vi.fn(),
}));

vi.mock("@/server/server", () => ({
  getOidcLoginService: () => loginService,
}));

beforeEach(() => {
  loginService.createLogin.mockReturnValue({
    authorizationUrl: new URL(
      "http://localhost:8080/realms/run-method/protocol/openid-connect/auth?response_type=code",
    ),
    transaction: "encoded-transaction",
    callbackPath: "/auth/callback",
    secureCookie: false,
  });
});

test("redirects to the authorization endpoint with a protected transaction cookie", () => {
  const response = GET();

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe(
    "http://localhost:8080/realms/run-method/protocol/openid-connect/auth?response_type=code",
  );
  expect(response.headers.get("cache-control")).toBe("no-store");

  const cookie = response.headers.get("set-cookie");
  expect(cookie).toContain("run_method_oidc_transaction=encoded-transaction");
  expect(cookie).toContain("Path=/auth/callback");
  expect(cookie).toContain("Max-Age=600");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=lax");
  expect(cookie).not.toContain("Secure");
  expect(cookie).not.toContain("Domain=");
});

test("marks the transaction cookie as secure for an HTTPS callback", () => {
  loginService.createLogin.mockReturnValue({
    authorizationUrl: new URL("https://identity.example.com/authorize"),
    transaction: "encoded-transaction",
    callbackPath: "/callback",
    secureCookie: true,
  });

  const response = GET();

  expect(response.headers.get("set-cookie")).toContain("Secure");
});

test("returns a stable error when login initiation fails", async () => {
  loginService.createLogin.mockImplementation(() => {
    throw new Error("OIDC_CLIENT_ID is missing");
  });

  const response = GET();

  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("no-store");
  await expect(response.json()).resolves.toEqual({
    error: "Unable to start sign in",
  });
});
