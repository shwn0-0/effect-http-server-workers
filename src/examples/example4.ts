import { BunRuntime } from "@effect/platform-bun";
import { Effect, Logger, LogLevel, Schedule } from "effect";

const flakyService = Effect.gen(function* () {
  const random = yield* Effect.random;
  const value = yield* random.nextIntBetween(0, 6);

  if (value <= 4) {
    const result = `Failed - ${value}`;
    yield* Effect.logDebug(result);
    return yield* Effect.fail(result);
  }

  const result = `Succeeded - ${value}`;
  yield* Effect.logDebug(result);
  return result;
}).pipe(Effect.withLogSpan("flakyService"));

const program = Effect.gen(function* () {
  const task = (id: number) => {
    let count = 0;
    return Effect.gen(function* () {
      count += 1;
      return yield* flakyService;
    }).pipe(
      Effect.retry({
        times: 3,
        schedule: Schedule.exponential("100 millis", 2).pipe(Schedule.jittered),
      }),
      Effect.matchEffect({
        onSuccess: Effect.fn(function* (result) {
          yield* Effect.logDebug(`[${id}] Result: ${result} (${count})`);
          return true;
        }),
        onFailure: Effect.fn(function* (error) {
          yield* Effect.logDebug(`[${id}] Result: ${error} (${count})`);
          return false;
        }),
      }),
      Effect.withLogSpan("request"),
    );
  };

  const results = yield* Effect.all(
    Array.from({ length: 5 }, (_, id) => task(id)),
    {
      concurrency: "unbounded",
    },
  );
  yield* Effect.logInfo(
    `${results.reduce((acc, value) => acc + (value ? 1 : 0), 0)} requests succeeded`,
  );
}).pipe(
  Effect.withLogSpan("program"),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  // Logger.withMinimumLogLevel(LogLevel.Info),
  Effect.forever,
);

program.pipe(BunRuntime.runMain);
