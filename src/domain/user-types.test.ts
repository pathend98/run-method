import { userSchema } from "./user-types";

test("userSchema accepts a user with a nonempty ID", () => {
  expect(userSchema.parse({ id: "user-id" })).toEqual({ id: "user-id" });
});

test.each(["", null, undefined])("userSchema rejects invalid ID %#", (id) => {
  expect(() => userSchema.parse({ id })).toThrow();
});
