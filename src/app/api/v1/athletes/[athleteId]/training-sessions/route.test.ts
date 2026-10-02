import type * as ServerModule from "@/server/server";
import { NextRequest } from "next/server";

import { BadRequestError } from "@/server/errors/bad-request-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { createUser } from "@/test-support/fixtures/user";
import { GET, POST } from "./route";

const repository = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  deleteById: vi.fn(),
  skip: vi.fn(),
  complete: vi.fn(),
  edit: vi.fn(),
}));
const serviceCalls = vi.hoisted(() => vi.fn());

const domainValidator = vi.hoisted(() => ({
  validateEdit: vi.fn(),
  validateSkip: vi.fn(),
  validateComplete: vi.fn(),
}));
const findBySessionKey = vi.hoisted(() => vi.fn());
const findUserById = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", async (importOriginal) => {
  const actual = await importOriginal<typeof ServerModule>();
  const { DefaultRequestAuthenticationService } =
    await import("@/server/http/request-authentication-service");
  const { DefaultTrainingSessionsService } =
    await import("@/server/training-sessions/training-sessions-service");
  return {
    ...actual,
    requestAuthenticationService: new DefaultRequestAuthenticationService(
      () => ({ findBySessionKey }),
    ),
    getTrainingSessionsService: () => {
      serviceCalls();
      return new DefaultTrainingSessionsService(repository, domainValidator, {
        findById: findUserById,
      });
    },

    getUserService: () => ({ findBySessionKey }),
  };
});

const athleteId = "33333333-3333-4333-8333-333333333333";
const otherAthleteId = "44444444-4444-4444-8444-444444444444";
const createBody = {
  activityType: "STRENGTH" as const,
  title: "Strength",
  date: "2026-08-26",
  timeOfDay: null,
  description: null,
  targetDurationSeconds: null,
};
const sessionKey = "session-key";

beforeEach(() => {
  vi.resetAllMocks();
  findBySessionKey.mockResolvedValue(createUser({ id: athleteId }));
  findUserById.mockResolvedValue(createUser({ id: athleteId }));
});

function request(id = athleteId, query = "", cookie = sessionKey) {
  return new NextRequest(
    `http://localhost/api/v1/athletes/${id}/training-sessions${query}`,
    { headers: cookie ? { cookie: `__Host-user-session=${cookie}` } : {} },
  );
}

function context(id = athleteId) {
  return { params: Promise.resolve({ athleteId: id }) };
}

test("returns sessions for an athlete with the existing query filters", async () => {
  const sessions = [{ id: "11111111-1111-4111-8111-111111111111" }];
  repository.find.mockResolvedValue(sessions);

  const response = await GET(
    request(athleteId, "?from=2026-08-17&to=2026-08-23&status=SCHEDULED"),
    context(),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual(sessions);
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith(sessionKey);
  expect(repository.find).toHaveBeenCalledWith({
    athleteId,
    from: "2026-08-17",
    to: "2026-08-23",
    status: "SCHEDULED",
  });
});

test("returns an empty list when an athlete has no sessions", async () => {
  repository.find.mockResolvedValue([]);

  const response = await GET(request(), context());

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual([]);
  expect(repository.find).toHaveBeenCalledWith({
    athleteId,
    from: undefined,
    to: undefined,
    status: undefined,
  });
});

test.each([
  ["athleteId", "", "not-a-uuid"],
  ["from", "?from=2026-02-30", athleteId],
  ["to", "?to=2026-02-29", athleteId],
  ["status", "?status=DUE", athleteId],
  ["from", "?from=", athleteId],
  ["to", "?to=", athleteId],
  ["status", "?status=", athleteId],
  ["from", "?from=2026-08-24&to=2026-08-23", athleteId],
])("returns field errors for invalid %s (%s)", async (field, query, id) => {
  const response = await GET(request(id, query), context(id));
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toMatchObject({
    error: "Invalid input",
    fieldErrors: { [field]: expect.arrayContaining([expect.any(String)]) },
  });
  expect(serviceCalls).not.toHaveBeenCalled();
  expect(repository.find).not.toHaveBeenCalled();
});

test.each(["", "invalid"])(
  "authentication precedes query validation for session %s",
  async (cookie) => {
    if (cookie) findBySessionKey.mockRejectedValue(new UserNotFoundError());
    const response = await GET(
      request(athleteId, "?status=DUE", cookie),
      context(),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(serviceCalls).not.toHaveBeenCalled();
  },
);

test("invalid filters precede ownership checks", async () => {
  const response = await GET(
    request(otherAthleteId, "?status=DUE"),
    context(otherAthleteId),
  );
  expect(response.status).toBe(400);
  expect(serviceCalls).not.toHaveBeenCalled();
  expect(repository.find).not.toHaveBeenCalled();
});

test.each([
  ["GET", (cookie: string) => GET(request(athleteId, "", cookie), context())],
  [
    "POST",
    (cookie: string) => POST(postRequest("{", athleteId, cookie), context()),
  ],
])(
  "%s rejects a missing session before accessing training sessions",
  async (_method, call) => {
    const response = await call("");

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(findBySessionKey).not.toHaveBeenCalled();
    expect(repository.find).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  },
);

test.each([
  ["GET", () => GET(request(), context())],
  ["POST", () => POST(postRequest("{"), context())],
])("%s rejects an invalid session", async (_method, call) => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());

  const response = await call();

  expect(response.status).toBe(401);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  expect(repository.find).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test.each([
  ["GET", () => GET(request(otherAthleteId), context(otherAthleteId))],
  [
    "POST",
    () => POST(postRequest(undefined, otherAthleteId), context(otherAthleteId)),
  ],
])("%s forbids another athlete's session", async (_method, call) => {
  const response = await call();

  expect(response.status).toBe(403);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  expect(repository.find).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test.each([
  ["GET", () => GET(request(), context())],
  ["POST", () => POST(postRequest("{"), context())],
])("%s returns 500 when session lookup fails", async (_method, call) => {
  findBySessionKey.mockRejectedValue(new Error("database down"));

  const response = await call();

  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
  expect(repository.find).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test("returns 500 for unexpected failures", async () => {
  repository.find.mockRejectedValue(new Error("database down"));

  const response = await GET(request(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to fetch training sessions",
  });
});

function postRequest(
  body: string = JSON.stringify(createBody),
  id = athleteId,
  cookie = sessionKey,
) {
  return new NextRequest(
    `http://localhost/api/v1/athletes/${id}/training-sessions`,
    {
      method: "POST",
      body,
      headers: cookie ? { cookie: `__Host-user-session=${cookie}` } : {},
    },
  );
}

test.each([
  {
    activityType: "RUN",
    title: "Easy run",
    date: "2026-08-26",
    timeOfDay: "AM",
    description: null,
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
  },
  {
    activityType: "STRENGTH",
    title: "Strength",
    date: "2026-08-26",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: null,
  },
])("creates an athlete $activityType session", async (body) => {
  const session = {
    id: "11111111-1111-4111-8111-111111111111",
    athleteId,
    ...body,
  };
  repository.create.mockResolvedValue(session);

  const response = await POST(
    postRequest(JSON.stringify({ ...body, title: `  ${body.title}  ` })),
    context(),
  );

  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual(session);
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith(sessionKey);
  expect(repository.create).toHaveBeenCalledWith({ ...body, athleteId });
});

test("returns 400 for malformed JSON", async () => {
  const response = await POST(postRequest("{"), context());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });
  expect(repository.create).not.toHaveBeenCalled();
  expect(serviceCalls).not.toHaveBeenCalled();
});

test("returns field errors for invalid session fields", async () => {
  const response = await POST(
    postRequest(JSON.stringify({ ...createBody, title: "" })),
    context(),
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Invalid request body",
    fieldErrors: { title: [expect.any(String)] },
  });
  expect(serviceCalls).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test("returns 404 when the athlete does not exist", async () => {
  findUserById.mockRejectedValue(new UserNotFoundError());

  const response = await POST(postRequest(), context());

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    error: "User not found",
  });
  expect(repository.create).not.toHaveBeenCalled();
});

test("returns 400 for an invalid creation request", async () => {
  repository.create.mockRejectedValue(
    new BadRequestError("Invalid training session"),
  );

  const response = await POST(postRequest(), context());

  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
    error: "Invalid training session",
  });
});

test("returns 500 for unexpected creation failures", async () => {
  repository.create.mockRejectedValue(new Error("database down"));

  const response = await POST(postRequest(), context());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to create training session",
  });
});

test("malformed JSON takes precedence over another athlete's ownership", async () => {
  const response = await POST(
    postRequest("{", otherAthleteId),
    context(otherAthleteId),
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid request body",
    fieldErrors: { body: ["Request body must be valid JSON"] },
  });

  expect(findUserById).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test("applies creation defaults before passing the body to the service", async () => {
  repository.create.mockResolvedValue({ id: "created" });
  const response = await POST(
    postRequest(
      JSON.stringify({
        activityType: "STRENGTH",
        title: "  Strength  ",
        date: createBody.date,
      }),
    ),
    context(),
  );
  expect(response.status).toBe(201);
  expect(repository.create).toHaveBeenCalledExactlyOnceWith({
    ...createBody,
    athleteId,
  });
});

test.each([athleteId, otherAthleteId])(
  "schema errors take precedence over athlete lookup for %s",
  async (id) => {
    findUserById.mockRejectedValue(new UserNotFoundError());
    const response = await POST(postRequest("{}", id), context(id));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid request body",
      fieldErrors: expect.any(Object),
    });
    expect(serviceCalls).not.toHaveBeenCalled();
    expect(findUserById).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  },
);

test("rejects unexpected keys before invoking the service", async () => {
  const response = await POST(
    postRequest(JSON.stringify({ ...createBody, extra: true })),
    context(),
  );
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Invalid request body",
    fieldErrors: {
      extra: expect.arrayContaining(['Unrecognized key: "extra"']),
    },
  });
  expect(serviceCalls).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test.each(["missing", "invalid"])(
  "schema-invalid bodies still reject %s authentication first",
  async (kind) => {
    const invalidRequest = postRequest("{}");
    if (kind === "missing")
      invalidRequest.cookies.delete("__Host-user-session");
    if (kind === "invalid")
      findBySessionKey.mockRejectedValue(new UserNotFoundError());
    const response = await POST(invalidRequest, context());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(serviceCalls).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  },
);
