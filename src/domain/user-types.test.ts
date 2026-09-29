import { updateUserProfileSchema, userSchema } from "./user-types";

const registeredUser = {
  id: "user-id",
  kind: "REGISTERED",
  expiresAt: null,
  firstName: "Ada",
  measurementUnit: "MILES",
};

const guestUser = {
  id: "guest-id",
  kind: "GUEST",
  expiresAt: new Date("2026-10-01T12:00:00.000Z"),
  firstName: null,
  measurementUnit: "KILOMETRES",
};

test("userSchema accepts registered and guest users", () => {
  expect(userSchema.parse(registeredUser)).toEqual(registeredUser);
  expect(userSchema.parse(guestUser)).toEqual(guestUser);
  expect(
    userSchema.parse({
      ...guestUser,
      expiresAt: guestUser.expiresAt.toISOString(),
    }),
  ).toEqual(guestUser);
});

test.each(["", null, undefined])("userSchema rejects invalid ID %#", (id) => {
  expect(() => userSchema.parse({ ...registeredUser, id })).toThrow();
});

test.each(["UNKNOWN", null, undefined])(
  "userSchema rejects invalid kind %#",
  (kind) => {
    expect(() => userSchema.parse({ ...registeredUser, kind })).toThrow();
  },
);

test.each(["invalid", 123, undefined])(
  "userSchema rejects invalid expiry %#",
  (expiresAt) => {
    expect(() => userSchema.parse({ ...guestUser, expiresAt })).toThrow();
  },
);

test.each([undefined, "", " ", 42])(
  "userSchema rejects an absent or invalid first name %#",
  (firstName) => {
    expect(() => userSchema.parse({ ...registeredUser, firstName })).toThrow();
  },
);

test.each([undefined, null, "KM", "METRES"])(
  "userSchema rejects an invalid measurement unit %#",
  (measurementUnit) => {
    expect(() =>
      userSchema.parse({ ...registeredUser, measurementUnit }),
    ).toThrow();
  },
);

test("profile updates allow one field, trim names, and clear names", () => {
  expect(updateUserProfileSchema.parse({ firstName: "  Ada  " })).toEqual({
    firstName: "Ada",
  });
  expect(updateUserProfileSchema.parse({ firstName: null })).toEqual({
    firstName: null,
  });
  expect(updateUserProfileSchema.parse({ measurementUnit: "MILES" })).toEqual({
    measurementUnit: "MILES",
  });
});

test.each([
  {},
  { firstName: "" },
  { firstName: " " },
  { firstName: "x".repeat(101) },
  { measurementUnit: "KM" },
  { firstName: "Ada", role: "ADMIN" },
])("profile update rejects invalid body %#", (body) => {
  expect(() => updateUserProfileSchema.parse(body)).toThrow();
});
