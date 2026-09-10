import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readDatabaseTlsOptions } from "./database-tls";

let temporaryDirectory: string | undefined;

afterEach(() => {
  if (temporaryDirectory) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
    temporaryDirectory = undefined;
  }
});

test("preserves the connection string without TLS when no CA path is configured", () => {
  const connectionString = "postgres://user:password@localhost:5432/database";

  expect(readDatabaseTlsOptions(connectionString, undefined)).toEqual({
    connectionString,
  });
});

test("reads the configured CA bundle and enables verified TLS", () => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "run-method-"));
  const certificatePath = join(temporaryDirectory, "rds-ca.pem");
  const certificate =
    "-----BEGIN CERTIFICATE-----\ncertificate\n-----END CERTIFICATE-----\n";
  writeFileSync(certificatePath, certificate);

  expect(
    readDatabaseTlsOptions(
      "postgres://user:password@db.example.com:5432/database?sslmode=require&application_name=run-method",
      certificatePath,
    ),
  ).toEqual({
    connectionString:
      "postgres://user:password@db.example.com:5432/database?application_name=run-method",
    ssl: { ca: certificate, rejectUnauthorized: true },
  });
});

test("throws when the configured CA bundle cannot be read", () => {
  expect(() =>
    readDatabaseTlsOptions(
      "postgres://user:password@localhost:5432/database",
      "/does-not-exist/rds-ca.pem",
    ),
  ).toThrow(/ENOENT/);
});
