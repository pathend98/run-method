import { athleteRouteParamsSchema, idRouteParamsSchema } from "./route-params";

const uuid = "11111111-1111-4111-8111-111111111111";

describe.each([
  ["id", idRouteParamsSchema],
  ["athleteId", athleteRouteParamsSchema],
] as const)("%s route parameter", (key, schema) => {
  test("accepts a UUID", () => {
    expect(schema.parse({ [key]: uuid })).toEqual({ [key]: uuid });
  });
  test.each([
    "invalid",
    "",
    " 11111111-1111-4111-8111-111111111111 ",
    null,
    undefined,
    1,
  ])("rejects %j", (value) => {
    const result = schema.safeParse({ [key]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([key]);
  });
  test("rejects missing parameters", () => {
    expect(schema.safeParse({}).success).toBe(false);
  });
});
