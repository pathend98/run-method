import { userSchema } from "./user-types";

test("userSchema accepts registered and guest users", () => {
  const expiresAt = new Date("2026-10-01T12:00:00.000Z");
  expect(
    userSchema.parse({ id: "user-id", kind: "REGISTERED", expiresAt: null }),
  ).toEqual({ id: "user-id", kind: "REGISTERED", expiresAt: null });
  expect(
    userSchema.parse({ id: "guest-id", kind: "GUEST", expiresAt }),
  ).toEqual({ id: "guest-id", kind: "GUEST", expiresAt });
  expect(
    userSchema.parse({
      id: "guest-id",
      kind: "GUEST",
      expiresAt: expiresAt.toISOString(),
    }),
  ).toEqual({ id: "guest-id", kind: "GUEST", expiresAt });
});

test.each(["", null, undefined])("userSchema rejects invalid ID %#", (id) => {
  expect(() =>
    userSchema.parse({ id, kind: "REGISTERED", expiresAt: null }),
  ).toThrow();
});

test.each(["UNKNOWN", null, undefined])(
  "userSchema rejects invalid kind %#",
  (kind) => {
    expect(() =>
      userSchema.parse({ id: "user-id", kind, expiresAt: null }),
    ).toThrow();
  },
);

test.each(["invalid", 123, undefined])(
  "userSchema rejects invalid expiry %#",
  (expiresAt) => {
    expect(() =>
      userSchema.parse({ id: "user-id", kind: "GUEST", expiresAt }),
    ).toThrow();
  },
);
