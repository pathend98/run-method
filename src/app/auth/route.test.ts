import { GET } from "./route";

const createAuthorizationRedirect = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getAuthenticationService: () => ({ createAuthorizationRedirect }),
}));

afterEach(() => {
  vi.useRealTimers();
});

test("redirects to the authorization endpoint with a secure transaction cookie", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-22T15:50:02.000Z"));
  createAuthorizationRedirect.mockReturnValue({
    authorizationUrl: new URL(
      "https://identity.example.com/oauth2/authorize?response_type=code",
    ),
    transactionCookieValue: "encoded-transaction",
  });

  const response = GET();

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "https://identity.example.com/oauth2/authorize?response_type=code",
  );
  expect(response.headers.get("set-cookie")).toBe(
    "__Host-oidc-transaction=encoded-transaction; Path=/; Expires=Tue, 22 Sep 2026 16:00:02 GMT; Max-Age=600; Secure; HttpOnly; SameSite=lax",
  );
  expect(createAuthorizationRedirect).toHaveBeenCalledOnce();
});
