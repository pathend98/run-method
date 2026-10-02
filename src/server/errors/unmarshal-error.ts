export class UnmarshalError extends Error {
  constructor(readonly fieldErrors: Record<string, string[]>) {
    super("Invalid input");
    this.name = "UnmarshalError";
  }
}
