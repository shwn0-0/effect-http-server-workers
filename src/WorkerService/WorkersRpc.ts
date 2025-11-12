import { Rpc, RpcGroup } from "@effect/rpc";
import { Console, Effect, Layer, Schema } from "effect";
import { ApiError } from "@/GatewayService/index.js";
import { WorkerPool, WorkerPoolLive } from "./Pool.js";
import { WorkerRequest, WorkerRequestSchema } from "./worker/index.js";

export class WorkersRpcRequestSchema extends WorkerRequestSchema.omit("page") {}

export type WorkersRpcRequest = Schema.Schema.Type<
  typeof WorkersRpcRequestSchema
>;

export class WorkersRpc extends RpcGroup.make(
  Rpc.make("HomePage", {
    error: ApiError,
    success: Schema.String,
    payload: WorkersRpcRequestSchema,
  }),
  Rpc.make("AboutPage", {
    error: ApiError,
    success: Schema.String,
    payload: WorkersRpcRequestSchema,
  }),
  Rpc.make("UnknownPage", {
    error: ApiError,
    success: Schema.String,
  }),
) {}

export class WorkersService extends Effect.Service<WorkersService>()(
  "WorkerService",
  {
    dependencies: [WorkerPoolLive],
    effect: Effect.gen(function* () {
      const workers = yield* WorkerPool;
      return {
        handleRequest: (request: WorkerRequest) =>
          workers.executeEffect(request).pipe(
            Effect.tap(
              Console.log(
                `[Worker Service] Handled request for ${request.page}/`,
              ),
            ),
            Effect.catchAll((error) =>
              Effect.fail(
                new ApiError({
                  msg: `Error: failed to handle request: ${error}`,
                }),
              ),
            ),
          ),
      };
    }),
  },
) {}

export const WorkersLive = WorkersRpc.toLayer(
  Effect.gen(function* () {
    const workersService = yield* WorkersService;
    return {
      HomePage: (req) => workersService.handleRequest({ ...req, page: "home" }),
      AboutPage: (req) =>
        workersService.handleRequest({ ...req, page: "about" }),
      UnknownPage: () => workersService.handleRequest({ page: "404" }),
    };
  }),
).pipe(Layer.provide(WorkersService.Default));
