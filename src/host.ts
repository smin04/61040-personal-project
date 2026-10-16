import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";

import { assembleApplication } from "./assembly.ts";
import { weShouldPolicy } from "./http-edge.ts";

const application = assembleApplication();

const gateway = createGateway({
  application,
});

const api = createHttpHandler({
  application,
  gateway,
  policy: weShouldPolicy,
});

const html = await readFile(
  new URL("./web/index.html", import.meta.url),
  "utf8",
);

const bundle = await Bun.build({
  entrypoints: [
    fileURLToPath(
      new URL("./web/client.ts", import.meta.url),
    ),
  ],

  target: "browser",
  minify: false,
});

if (
  !bundle.success ||
  bundle.outputs.length !== 1
) {
  throw new Error(
    `Could not build browser app:\n${bundle.logs.join("\n")}`,
  );
}

const javascript =
  await bundle.outputs[0].text();

const server = Bun.serve({
  hostname: "localhost",
  port: 3000,

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (
      path === "/api" ||
      path.startsWith("/api/")
    ) {
      return api(request);
    }

    if (request.method !== "GET") {
      return new Response(
        "Method not allowed",
        {
          status: 405,
        },
      );
    }

    if (
      path === "/" ||
      path === "/index.html"
    ) {
      return new Response(
        html,
        {
          headers: {
            "Content-Type":
              "text/html; charset=utf-8",
          },
        },
      );
    }

    if (path === "/app.js") {
      return new Response(
        javascript,
        {
          headers: {
            "Content-Type":
              "text/javascript; charset=utf-8",
          },
        },
      );
    }

    return new Response(
      "Not found",
      {
        status: 404,
      },
    );
  },
});

console.log(
  `WeShould listening on ${server.url}`,
);