export class TrainingSessionsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "TrainingSessionsApiError";
  }
}
