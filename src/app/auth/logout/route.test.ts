import {
  KeycloakLogoutProvider,
  CognitoLogoutProvider,
} from "@/server/authentication/logout-provider";
import { NextRequest } from "next/server";

import { GET } from "./route";

const { deleteSession, getUserService, getLogoutUrlStrategy } = vi.hoisted(
  () => ({
    deleteSession: vi.fn(),
    getLogoutUrlStrategy: vi.fn(),
    getUserService: vi.fn(),
  }),
);

vi.mock("@/server/server", () => ({ getUserService, getLogoutUrlStrategy }));

const configuration = {
  endpoint: "https://identity.example.com/logout",
  callbackUrl: "https://app.example.com/",
  clientId: "run-method",
};

beforeEach(() => {
  deleteSession.mockResolvedValue(null);
  getLogoutUrlStrategy.mockReturnValue(
    new KeycloakLogoutProvider(configuration),
  );
  getUserService.mockReturnValue({ deleteSession });
});

afterEach(() => {
  vi.resetAllMocks();
});

function logoutRequest(sessionKey?: string) {
  const headers = new Headers({
    "x-forwarded-host": "run.example.com",
    "x-forwarded-proto": "https",
  });
  if (sessionKey !== undefined) {
    headers.set("cookie", `__Host-user-session=${sessionKey}`);
  }
  return new NextRequest("http://0.0.0.0:3000/auth/logout", { headers });
}

function expectLoggedOut(response: Awaited<ReturnType<typeof GET>>) {
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    new KeycloakLogoutProvider(configuration).createLogoutUrl().href,
  );
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.cookies.get("__Host-user-session")).toMatchObject({
    value: "",
    path: "/",
    maxAge: 0,
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  });
}

test("awaits session deletion before clearing the cookie and redirecting", async () => {
  let resolveDeletion!: () => void;
  deleteSession.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveDeletion = resolve;
    }),
  );
  let completed = false;
  const pending = GET(logoutRequest("session-key")).then((response) => {
    completed = true;
    return response;
  });

  await Promise.resolve();
  expect(completed).toBe(false);
  expect(deleteSession).toHaveBeenCalledExactlyOnceWith("session-key");
  resolveDeletion();
  expectLoggedOut(await pending);
});

test.each([undefined, ""])(
  "logs out without database access for cookie %s",
  async (cookie) => {
    expectLoggedOut(await GET(logoutRequest(cookie)));
    expect(getUserService).not.toHaveBeenCalled();
  },
);

test("clears the cookie and redirects when session deletion fails", async () => {
  deleteSession.mockRejectedValue(new Error("database unavailable"));
  expectLoggedOut(await GET(logoutRequest("session-key")));
});

test("clears the cookie and redirects when service initialization fails", async () => {
  getUserService.mockImplementation(() => {
    throw new Error("database configuration unavailable");
  });
  expectLoggedOut(await GET(logoutRequest("session-key")));
});

test.each([
  ["keycloak", new KeycloakLogoutProvider(configuration)],
  ["cognito", new CognitoLogoutProvider(configuration)],
])("redirects a deleted session through %s", async (_, strategy) => {
  deleteSession.mockResolvedValue("session-id-token");
  getLogoutUrlStrategy.mockReturnValue(strategy);
  const response = await GET(logoutRequest("session-key"));
  expect(response.headers.get("location")).toBe(
    strategy.createLogoutUrl("session-id-token").href,
  );
  expect(response.cookies.get("__Host-user-session")?.maxAge).toBe(0);
});
