import { Context, Layer } from "effect";
import { Worker as EffectWorker } from "@effect/platform";
import { BunWorker } from "@effect/platform-bun";
import { WorkerError, WorkerRequest } from "./worker/index.js";

export interface WorkerPool {
  readonly _: unique symbol;
}

export const WorkerPool = Context.GenericTag<
  WorkerPool,
  EffectWorker.WorkerPool<WorkerRequest, string, WorkerError>
>("MyWorkerPool");

export const WorkerPoolLive = EffectWorker.makePoolLayer(WorkerPool, {
  size: 2,
  concurrency: 2,
}).pipe(Layer.provide(BunWorker.layer(() => tsWorker("./worker/Worker.ts"))));

const tsWorker = (path: string) => new Worker(new URL(path, import.meta.url));
