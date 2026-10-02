import {
  positiveIntegerSchema,
  trimmedNonEmptyStringSchema,
} from "./field-schemas";

test("trims surrounding whitespace while preserving internal spaces", () => {
  expect(trimmedNonEmptyStringSchema.parse("  Easy run  ")).toBe("Easy run");
});

test.each(["", " ", "\t\n", null, undefined, 1])(
  "rejects invalid text %j",
  (value) => {
    expect(trimmedNonEmptyStringSchema.safeParse(value).success).toBe(false);
  },
);

test.each([1, 5000])("accepts positive integer %s", (value) => {
  expect(positiveIntegerSchema.parse(value)).toBe(value);
});

test.each([0, -1, 1.5, NaN, Infinity, "1", null, undefined])(
  "rejects invalid number %s",
  (value) => {
    expect(positiveIntegerSchema.safeParse(value).success).toBe(false);
  },
);
