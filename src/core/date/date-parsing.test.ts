import { parseDateFromString } from "./date-parsing";

test("parseDateFromString accepts strict ISO dates", () => {
  expect(parseDateFromString("2026-08-17")).toBeInstanceOf(Date);
});

test.each(["2026-02-30", "08/17/2026", "2026-8-17", "2026-08-17T00:00:00"])(
  "parseDateFromString rejects %s",
  (value) => {
    expect(parseDateFromString(value)).toBeNull();
  },
);
