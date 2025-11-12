import { Effect } from "effect";
import { BunRuntime } from "@effect/platform-bun";

const program = Effect.gen(function* () {
  const sem = yield* Effect.makeSemaphore(2);

  const task = Effect.fn((id: number) =>
    Effect.gen(function* () {
      yield* Effect.log(`[${id}] Waiting for semaphore.`);

      yield* Effect.gen(function* () {
        const random = yield* Effect.random;
        const n = yield* random.nextIntBetween(3, 10);
        yield* Effect.log(
          `[${id}] Acquired Semaphore, Working for ${n} seconds.`,
        );
        yield* Effect.sleep(`${n} seconds`);
        yield* Effect.log(`[${id}] Work finished.`);
      }).pipe(sem.withPermits(1));

      yield* Effect.log(`[${id}] Done with semaphore.`);
    }),
  );

  yield* Effect.all(
    new Array(5).fill(null).map((_, idx) => task(idx + 1)),
    { concurrency: "unbounded" },
  );
});

BunRuntime.runMain(program);
