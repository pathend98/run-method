import { NextRequest } from "next/server";

import { GET } from "./route";

const { deleteSession, getUserService } = vi.hoisted(() => ({
  deleteSession: vi.fn(),
  getUserService: vi.fn(),
}));

vi.mock("@/server/server", () => ({ getUserService }));

beforeEach(() => {
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
  return new NextRequest("http://0.0.0.0:3000/logout", { headers });
}

function expectLoggedOut(response: Awaited<ReturnType<typeof GET>>) {
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("/");
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
