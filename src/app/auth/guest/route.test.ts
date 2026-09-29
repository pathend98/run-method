import { GET } from "./route";

const startGuestSession = vi.hoisted(() => vi.fn());
const appEnv = vi.hoisted(() => ({ APP_BASE_URL: "https://app.example.com/" }));

vi.mock("@/server/server", () => ({
  getUserService: () => ({ startGuestSession }),
}));
vi.mock("@/server/env/app-env", () => ({ readAppEnv: () => appEnv }));

afterEach(() => {
  startGuestSession.mockReset();
  appEnv.APP_BASE_URL = "https://app.example.com/";
});

test.each(["https://app.example.com", "https://app.example.com/"])(
  "starts a guest session and redirects to the app root with the regular cookie (%s)",
  async (baseUrl) => {
    appEnv.APP_BASE_URL = baseUrl;
    startGuestSession.mockResolvedValue("session-key");

    const response = await GET();

    expect(startGuestSession).toHaveBeenCalledOnce();
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

test("returns an error without a session cookie when User entry fails", async () => {
  startGuestSession.mockRejectedValue(new Error("database unavailable"));

  const response = await GET();

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete authentication",
  });
  expect(response.cookies.get("__Host-user-session")).toBeUndefined();
});
