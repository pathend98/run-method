// Opt in with TRAINING_GOALS_TEST_DATABASE_URL pointing to a disposable local
// PostgreSQL instance. Each run creates and drops its own isolated database.
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { RequestValidationError } from "@/server/errors/request-validation-error";
import { TrainingGoalOverlapError } from "./training-goals-errors";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { DefaultTrainingGoalsService } from "./training-goals-service";
import { DefaultTrainingGoalsValidator } from "./training-goals-validator";
import type { CreateTrainingGoalInput } from "./training-goals-repository";
import { DrizzleTrainingGoalsRepository } from "./training-goals-repository";
import { DefaultTrainingGoalsTransformer } from "./training-goals-transformer";

const databaseUrl = process.env.TRAINING_GOALS_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("training goal PostgreSQL integration", () => {
  let admin: Pool;
  let pool: Pool;
  let repository: DrizzleTrainingGoalsRepository;
  let service: DefaultTrainingGoalsService;

  function create(request: CreateTrainingGoalInput) {
    const { athleteId, ...fields } = request;
    return service.create(athleteId, athleteId, fields);
  }
  const databaseName = `training_goals_test_${randomUUID().replaceAll("-", "")}`;
  const athleteId = randomUUID();
  const otherId = randomUUID();
  const input = {
    athleteId,
    title: "Fitness block",
    purpose: "Build endurance",
    trainingIntentions: "Run consistently",
    startDate: "2026-06-01",
    targetDate: "2026-06-10",
  };

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
      throw new Error(
        "Integration tests require a disposable local PostgreSQL instance",
      );
    }
    admin = new Pool({ connectionString: url.toString() });
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    url.pathname = `/${databaseName}`;
    pool = new Pool({ connectionString: url.toString() });
    const migrations = readdirSync("db/migrations")
      .filter((name) => name.endsWith(".sql"))
      .sort();
    for (const name of migrations) {
      if (name.startsWith("0007_")) {
        // Historical migrations seeded sessions before introducing ownership.
        // Supply their owner so the pre-existing NOT NULL migration can run.
        await pool.query('INSERT INTO "user" (id) VALUES ($1), ($2)', [
          athleteId,
          otherId,
        ]);
        await pool.query("UPDATE training_sessions SET athlete_id = $1", [
          athleteId,
        ]);
      }
      if (name.startsWith("0013_")) {
        for (const status of ["ACTIVE", "COMPLETED", "DISCARDED"]) {
          await pool.query(
            "INSERT INTO training_goals (athlete_id, title, type, status) VALUES ($1, 'Old goal', 'OPEN', $2)",
            [athleteId, status],
          );
        }
      }
      await pool.query(readFileSync(`db/migrations/${name}`, "utf8"));
    }
    repository = new DrizzleTrainingGoalsRepository(
      drizzle(pool),
      new DefaultTrainingGoalsTransformer(),
    );
    service = new DefaultTrainingGoalsService(
      repository,
      new DefaultTrainingGoalsValidator(),
    );
  });

  afterAll(async () => {
    await pool?.end();
    if (admin) {
      try {
        await admin.query(
          `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
        );
      } finally {
        await admin.end();
      }
    }
  });

  test("migration removes existing goals, retains other data, and exposes exactly the new columns", async () => {
    expect(
      (await pool.query("SELECT count(*) FROM training_goals")).rows[0].count,
    ).toBe("0");
    expect(
      Number(
        (await pool.query("SELECT count(*) FROM training_sessions")).rows[0]
          .count,
      ),
    ).toBeGreaterThan(0);
    const columns = (
      await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name='training_goals'",
      )
    ).rows.map((row) => row.column_name);
    expect(columns.sort()).toEqual(
      [
        "id",
        "athlete_id",
        "created_at",
        "title",
        "purpose",
        "training_intentions",
        "start_date",
        "target_date",
        "resolution",
        "resolved_at",
      ].sort(),
    );
  });

  describe("persistence", () => {
    beforeEach(async () => {
      await pool.query("DELETE FROM training_goals");
    });

    test.each([
      ["title", " "],
      ["purpose", " "],
      ["training_intentions", " "],
      ["start_date", "2026-07-01"],
      ["target_date", null],
      ["resolution", "invalid"],
      ["resolution", "completed"],
      ["resolved_at", "2026-06-10T12:00:00Z"],
    ])("database rejects invalid %s: %s", async (column, value) => {
      const fields = {
        athlete_id: athleteId,
        title: input.title,
        purpose: input.purpose,
        training_intentions: input.trainingIntentions,
        start_date: input.startDate,
        target_date: input.targetDate,
        resolution: null,
        resolved_at: null,
        [column as string]: value,
      };
      await expect(
        pool.query(
          `INSERT INTO training_goals (${Object.keys(fields).join(", ")}) VALUES (${Object.keys(
            fields,
          )
            .map((_, i) => `$${i + 1}`)
            .join(", ")})`,
          Object.values(fields),
        ),
      ).rejects.toMatchObject({ code: expect.stringMatching(/^235(02|14)$/) });
    });

    test.each([
      ["2026-06-01", "2026-06-10"], // identical
      ["2026-06-02", "2026-06-05"], // contained
      ["2026-05-01", "2026-07-01"], // containing
      ["2026-05-20", "2026-06-01"], // touching start
      ["2026-06-10", "2026-06-20"], // touching end
    ])(
      "rejects overlapping creation %s through %s",
      async (startDate, targetDate) => {
        await create(input);
        await expect(
          create({ ...input, startDate, targetDate }),
        ).rejects.toBeInstanceOf(TrainingGoalOverlapError);
      },
    );

    test("accepts adjacent periods, other athletes, and same-day goals", async () => {
      await create(input);
      await create({ ...input, athleteId: otherId });
      await create({
        ...input,
        startDate: "2026-06-11",
        targetDate: "2026-06-11",
      });
      expect(await service.find(athleteId, athleteId)).toHaveLength(2);
    });

    test("validates merged dates and excludes itself during date edits", async () => {
      const goal = await create(input);
      await expect(
        service.edit(athleteId, goal.id, { startDate: "2026-07-01" }),
      ).rejects.toBeInstanceOf(RequestValidationError);
      await expect(
        service.edit(athleteId, goal.id, { targetDate: "2026-05-01" }),
      ).rejects.toBeInstanceOf(RequestValidationError);
      expect(
        await service.edit(athleteId, goal.id, { targetDate: "2026-06-12" }),
      ).toMatchObject({ targetDate: "2026-06-12", purpose: input.purpose });
      const next = await create({
        ...input,
        startDate: "2026-06-13",
        targetDate: "2026-06-20",
      });
      await expect(
        service.edit(athleteId, next.id, { startDate: "2026-06-12" }),
      ).rejects.toBeInstanceOf(TrainingGoalOverlapError);
    });

    test.each(["complete", "discard"] as const)(
      "%s records timestamp, frees dates, and prevents later mutations",
      async (operation) => {
        const goal = await create(input);
        expect(goal).toMatchObject({ resolution: null, resolvedAt: null });
        await expect(service[operation](otherId, goal.id)).rejects.toThrow(
          ForbiddenError,
        );
        const resolved = await service[operation](athleteId, goal.id);
        expect(resolved?.resolution).toBe(
          operation === "complete" ? "completed" : "discarded",
        );
        expect(resolved?.resolvedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        await expect(service.complete(athleteId, goal.id)).rejects.toThrow(
          "Only unresolved training goals",
        );
        await expect(service.discard(athleteId, goal.id)).rejects.toThrow(
          "Only unresolved training goals",
        );
        await expect(
          service.edit(athleteId, goal.id, { title: "No" }),
        ).rejects.toThrow("Only unresolved training goals");
        await create(input);
      },
    );

    test("serializes concurrent overlapping creates", async () => {
      const results = await Promise.allSettled([create(input), create(input)]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        results.find((result) => result.status === "rejected"),
      ).toMatchObject({ reason: expect.any(TrainingGoalOverlapError) });
    });

    test("serializes concurrent date edits which would overlap", async () => {
      const a = await create(input);
      const b = await create({
        ...input,
        startDate: "2026-06-20",
        targetDate: "2026-06-30",
      });
      const results = await Promise.allSettled([
        service.edit(athleteId, a.id, { targetDate: "2026-06-15" }),
        service.edit(athleteId, b.id, { startDate: "2026-06-15" }),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        results.find((result) => result.status === "rejected"),
      ).toMatchObject({ reason: expect.any(TrainingGoalOverlapError) });
    });

    test("uses the latest row for concurrent partial edits", async () => {
      const goal = await create(input);
      const results = await Promise.allSettled([
        service.edit(athleteId, goal.id, { startDate: "2026-06-08" }),
        service.edit(athleteId, goal.id, { targetDate: "2026-06-05" }),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      expect(
        results.find((result) => result.status === "rejected"),
      ).toMatchObject({ reason: expect.any(RequestValidationError) });
    });

    test("rolls back writes if the locked callback fails", async () => {
      const error = new Error("Abort transaction");
      await expect(
        repository.withAthleteLock(athleteId, async (transactionRepository) => {
          await transactionRepository.create(input);
          throw error;
        }),
      ).rejects.toBe(error);
      expect(await repository.find(athleteId)).toEqual([]);
    });
  });
});
