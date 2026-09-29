import { createUser } from "./user";

test("creates a registered user with the default fields", () => {
  expect(createUser()).toEqual({
    id: "user-id",
    kind: "REGISTERED",
    expiresAt: null,
    firstName: null,
    measurementUnit: "KILOMETRES",
  });
});

test("applies overrides without changing later fixtures", () => {
  const expiry = new Date("2026-10-01T12:00:00.000Z");
  const guest = createUser({
    id: "guest-id",
    kind: "GUEST",
    expiresAt: expiry,
    firstName: "Ada",
    measurementUnit: "MILES",
  });

  expect(guest).toEqual({
    id: "guest-id",
    kind: "GUEST",
    expiresAt: expiry,
    firstName: "Ada",
    measurementUnit: "MILES",
  });
  expect(createUser()).not.toBe(guest);
  expect(createUser()).toEqual({
    id: "user-id",
    kind: "REGISTERED",
    expiresAt: null,
    firstName: null,
    measurementUnit: "KILOMETRES",
  });
});
