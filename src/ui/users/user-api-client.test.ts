import { UserApiError } from "./errors/user-api-error";
import { fetchCurrentUser } from "./user-api-client";

test("fetchCurrentUser returns a validated registered user", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "user-id",
        kind: "REGISTERED",
        expiresAt: null,
      }),
    }),
  );

  await expect(fetchCurrentUser()).resolves.toEqual({
    id: "user-id",
    kind: "REGISTERED",
    expiresAt: null,
  });
  expect(fetch).toHaveBeenCalledWith("/api/v1/me", { cache: "no-store" });
});

test("fetchCurrentUser parses a guest expiry into a Date", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "guest-id",
        kind: "GUEST",
        expiresAt: "2026-10-01T12:00:00.000Z",
      }),
    }),
  );

  await expect(fetchCurrentUser()).resolves.toEqual({
    id: "guest-id",
    kind: "GUEST",
    expiresAt: new Date("2026-10-01T12:00:00.000Z"),
  });
});

test("fetchCurrentUser exposes API error status and message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: "Unauthorized" }),
    }),
  );

  await expect(fetchCurrentUser()).rejects.toMatchObject({
    name: "UserApiError",
    message: "Unauthorized",
    status: 401,
  });
});

test("fetchCurrentUser uses a stable message for a non-JSON API error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    }),
  );

  await expect(fetchCurrentUser()).rejects.toEqual(
    new UserApiError("Unable to fetch current user", 500),
  );
});

test("fetchCurrentUser rejects a malformed response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: "",
        kind: "REGISTERED",
        expiresAt: null,
      }),
    }),
  );

  await expect(fetchCurrentUser()).rejects.toThrow();
});
