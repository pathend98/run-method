import type * as ServerModule from "@/server/server";
import { GET } from "./route";

const createAuthorizationRedirect = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", async (importOriginal) => ({
  ...(await importOriginal<typeof ServerModule>()),
  getAuthenticationService: () => ({ createAuthorizationRedirect }),
}));

afterEach(() => {
  vi.useRealTimers();
  createAuthorizationRedirect.mockReset();
});

test("redirects to the authorization endpoint with a secure transaction cookie", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-22T15:50:02.000Z"));
  createAuthorizationRedirect.mockReturnValue({
    authorizationUrl: new URL(
      "https://identity.example.com/oauth2/authorize?response_type=code",
    ),
    transactionCookieValue: "encoded-transaction",
  });

  const response = await GET();

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "https://identity.example.com/oauth2/authorize?response_type=code",
  );
  expect(response.headers.get("set-cookie")).toBe(
    "__Host-oidc-transaction=encoded-transaction; Path=/; Expires=Tue, 22 Sep 2026 16:00:02 GMT; Max-Age=600; Secure; HttpOnly; SameSite=lax",
  );
  expect(createAuthorizationRedirect).toHaveBeenCalledOnce();
});

test("returns a safe no-store error when login initialization fails", async () => {
  createAuthorizationRedirect.mockImplementation(() => {
    throw new Error("private configuration");
  });
  const response = await GET();
  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.cookies.get("__Host-oidc-transaction")).toBeUndefined();
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete authentication",
  });
});
