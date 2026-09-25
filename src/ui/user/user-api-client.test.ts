import { fetchCurrentUser, UserApiError } from "./user-api-client";

test("fetchCurrentUser returns the validated user ID", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "user-id" }),
    }),
  );

  await expect(fetchCurrentUser()).resolves.toEqual({ id: "user-id" });
  expect(fetch).toHaveBeenCalledWith("/api/v1/me", { cache: "no-store" });
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
      json: vi.fn().mockResolvedValue({ id: "" }),
    }),
  );

  await expect(fetchCurrentUser()).rejects.toThrow();
});
