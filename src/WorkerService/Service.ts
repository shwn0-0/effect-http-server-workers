import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Layer } from "effect";
import { HttpRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { WorkersLive, WorkersRpc } from "./WorkersRpc.js";

const RpcLayer = RpcServer.layer(WorkersRpc).pipe(Layer.provide(WorkersLive));

const HttpProtocol = RpcServer.layerProtocolHttp({
  path: "/rpc",
}).pipe(Layer.provide(RpcSerialization.layerMsgPack));

const Main = HttpRouter.Default.serve().pipe(
  Layer.provide(RpcLayer),
  Layer.provide(HttpProtocol),
  Layer.provide(BunHttpServer.layerServer({ port: 8080 })),
);

Layer.launch(Main).pipe(BunRuntime.runMain);
