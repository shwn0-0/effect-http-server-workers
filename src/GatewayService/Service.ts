import { Console, Effect, Layer } from "effect";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { FetchHttpClient, HttpApiBuilder } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { WorkersRpc } from "@/WorkerService/index.js";
import { Api, ApiError } from "./Api.js";

const WorkersRpcClient = RpcClient.make(WorkersRpc);
const RpcProtocolLive = RpcClient.layerProtocolHttp({
  url: "http://localhost:8080/rpc",
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerMsgPack]));

const ApiIndexGroupImplementation = HttpApiBuilder.group(
  Api,
  "Index",
  (handlers) =>
    handlers
      .handle("home", ({ urlParams }) =>
        Effect.gen(function* () {
          const rpc = yield* WorkersRpcClient;
          yield* Console.log(
            "[Gateway Service] Handling request for Home Page",
          );
          return yield* rpc.HomePage(urlParams);
        }).pipe(
          Effect.catchTag("RpcClientError", ({ message: msg }) =>
            Effect.fail(new ApiError({ msg })),
          ),
        ),
      )
      .handle("about", ({ urlParams }) =>
        Effect.gen(function* () {
          const rpc = yield* WorkersRpcClient;
          yield* Console.log(
            "[Gateway Service] Handling request for About Page",
          );
          return yield* rpc.AboutPage(urlParams);
        }).pipe(
          Effect.catchTag("RpcClientError", ({ message: msg }) =>
            Effect.fail(new ApiError({ msg })),
          ),
        ),
      )
      .handle("favicon", () =>
        Console.log("[Gateway Service] Handling favicon"),
      )
      .handle("catchAll", () =>
        Effect.gen(function* () {
          const rpc = yield* WorkersRpcClient;
          yield* Console.log(
            "[Gateway Service] Handling request for Unknown Page",
          );
          return yield* Effect.fail(yield* rpc.UnknownPage());
        }).pipe(
          Effect.catchTag("RpcClientError", ({ message: msg }) =>
            Effect.fail(new ApiError({ msg })),
          ),
        ),
      ),
);

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide(ApiIndexGroupImplementation),
);

const ServerLive = HttpApiBuilder.serve().pipe(
  Layer.provide(ApiLive),
  Layer.provide(RpcProtocolLive),
  Layer.provide(
    BunHttpServer.layer({
      port: 3000,
    }),
  ),
);

Layer.launch(ServerLive).pipe(BunRuntime.runMain);
