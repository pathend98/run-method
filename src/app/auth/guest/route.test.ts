import { createUser } from "@/test-support/fixtures/user";
import { GET } from "./route";

const createGuestUser = vi.hoisted(() => vi.fn());
const createGuestUserSession = vi.hoisted(() => vi.fn());
const appEnv = vi.hoisted(() => ({ APP_BASE_URL: "https://app.example.com/" }));

vi.mock("@/server/server", () => ({
  getUserService: () => ({ createGuestUser, createGuestUserSession }),
}));
vi.mock("@/server/env/app-env", () => ({ readAppEnv: () => appEnv }));

afterEach(() => {
  createGuestUser.mockReset();
  createGuestUserSession.mockReset();
  appEnv.APP_BASE_URL = "https://app.example.com/";
});

test.each(["https://app.example.com", "https://app.example.com/"])(
  "creates a guest session and redirects to the app root with the regular cookie (%s)",
  async (baseUrl) => {
    appEnv.APP_BASE_URL = baseUrl;
    createGuestUser.mockResolvedValue(
      createUser({ id: "guest-id", kind: "GUEST" }),
    );
    createGuestUserSession.mockResolvedValue("session-key");

    const response = await GET();

    expect(createGuestUser).toHaveBeenCalledOnce();
    expect(createGuestUserSession).toHaveBeenCalledExactlyOnceWith("guest-id");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.cookies.get("__Host-user-session")).toMatchObject({
      value: "session-key",
      path: "/",
      maxAge: 2592000,
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
  },
);

test.each(["createGuestUser", "createGuestUserSession"])(
  "returns an error without a session cookie when %s fails",
  async (operation) => {
    createGuestUser.mockResolvedValue(
      createUser({ id: "guest-id", kind: "GUEST" }),
    );
    createGuestUserSession.mockResolvedValue("session-key");
    (operation === "createGuestUser"
      ? createGuestUser
      : createGuestUserSession
    ).mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to complete authentication",
    });
    expect(response.cookies.get("__Host-user-session")).toBeUndefined();
    if (operation === "createGuestUser") {
      expect(createGuestUserSession).not.toHaveBeenCalled();
    }
  },
);
