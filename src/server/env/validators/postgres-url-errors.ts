export class InvalidPostgresUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPostgresUrlError";
  }
}
