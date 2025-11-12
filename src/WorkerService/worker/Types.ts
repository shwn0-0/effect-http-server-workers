import { Schema } from "effect";

export class WorkerRequestSchema extends Schema.Struct({
  page: Schema.Literal("home", "about", "404"),
  content: Schema.optionalWith(Schema.NonEmptyString, { exact: true }),
}) {}

export type WorkerRequest = Schema.Schema.Type<typeof WorkerRequestSchema>;

export class WorkerError extends Schema.TaggedError<WorkerError>()(
  "WorkerError",
  { message: Schema.String },
) {}
