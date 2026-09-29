import { BadRequestError } from "@/server/errors/bad-request-error";
import { DefaultUserProfileRequestValidator } from "./user-profile-request-validator";

const validator = new DefaultUserProfileRequestValidator();

test("accepts partial profile updates and trims first names", () => {
  expect(validator.validateUpdate({ firstName: " Ada " })).toEqual({
    firstName: "Ada",
  });
  expect(validator.validateUpdate({ firstName: null })).toEqual({
    firstName: null,
  });
  expect(validator.validateUpdate({ measurementUnit: "MILES" })).toEqual({
    measurementUnit: "MILES",
  });
});

test.each([{}, { firstName: " " }, { measurementUnit: "KM" }, null])(
  "rejects an invalid profile body %#",
  (body) => {
    expect(() => validator.validateUpdate(body)).toThrow(
      new BadRequestError("Invalid user profile"),
    );
  },
);
