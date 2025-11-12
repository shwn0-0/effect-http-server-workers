import { Console, Effect, Layer } from "effect";
import { BunRuntime, BunWorkerRunner } from "@effect/platform-bun";
import { WorkerRunner } from "@effect/platform";
import { WorkerError, WorkerRequest } from "./Types.js";

const worker = WorkerRunner.make(({ page, content }: WorkerRequest) =>
  Effect.gen(function* () {
    yield* Console.log(`[Worker] Received request for page "${page}"`);
    // yield* Effect.sleep("2 seconds"); // simulate some hard work
    switch (page) {
      case "home":
        content ??= "Welcome to the Home Page!";
        return yield* Effect.succeed(pageFromLayout("Home", "/", content));
      case "about":
        content ??= "Welcome to the About Page!";
        return yield* Effect.succeed(
          pageFromLayout("About", "/about", content),
        );
      case "404":
        return yield* Effect.succeed(
          pageFromLayout("404", "/", "Page Not Found"),
        );
      default:
        return yield* Effect.fail(
          new WorkerError({ message: "Unknown Endpoint" }),
        );
    }
  }),
).pipe(Layer.scopedDiscard, Layer.provide(BunWorkerRunner.layer));

const pageFromLayout = (
  title: string,
  link: string,
  content: string,
): string => `
  <!DOCTYPE html>
  <head>
    <title>Effect Http Server</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  </head>
  <body class="mx-10 my-5">
    <nav class="flex justify-center">
      <ul class="flex justify-around divide-x border rounded-md">
        <li>
          <button
            onclick="document.location='/'"
            class="cursor-pointer py-3 px-5 bg-stone-50 rounded-s-md hover:bg-stone-200"
          >Home</button>
        </li>
        <li>
          <button
            onclick="document.location='/about'"
            class="cursor-pointer py-3 px-5 bg-stone-50 rounded-e-md hover:bg-stone-200"
          >About</button>
        </li>
      </ul>
    </nav>
    <main class="flex flex-col justify-between min-h-[60vh]">
      <div>
        <h1 class="text-2xl"><a href="${link}">${title}</a></h1>
        <pre><code>${escapeHtml(content)}</code></pre>
      </div>
      <div class="flex justify-center">
        <form class="flex flex-col w-[50vw]">
          <label for="content">Content:</label>
          <textarea
            type="textarea"
            id="content"
            name="content"
            class="border rounded-sm h-[6em] p-1"
            placeholder="Enter content to display..."
          ></textarea>
          <input type="submit" class="bg-stone-100 hover:bg-stone-200 cursor-pointer border my-2 px-4 py-2 size-fit rounded-md" value="Update"/>
        </form>
      </div>
    </main>
  </body>
  
`;

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

BunWorkerRunner.launch(worker).pipe(BunRuntime.runMain);
