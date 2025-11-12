import { Effect } from "effect";

class RandomService extends Effect.Service<RandomService>()("RandomService", {
  effect: Effect.succeed({
    next: Effect.sync(() => Math.random()),
  }),
}) {}

Effect.gen(function* () {
  const random = yield* RandomService;
  const number = yield* random.next;

  if (number < 0.5) {
    return yield* Effect.succeed(`Succeeded with: ${number}`);
  } else {
    return yield* Effect.fail(`Failed with: ${number}`);
  }
}).pipe(
  Effect.match({
    onFailure: console.error,
    onSuccess: console.log,
  }),
  Effect.provide(RandomService.Default),
  Effect.runPromise,
);
