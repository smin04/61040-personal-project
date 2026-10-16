import { httpWire } from "@mit-sdg/sync-engine-http/tooling";

import { assembleApplication } from "./src/assembly.ts";
import { weShouldPolicy } from "./src/http-edge.ts";

export default {
  assemble: assembleApplication,
  title: "WeShould",
  wireName: "WeShouldWire",

  design: {
    version: 1,

    documents: [
      new URL(
        "./design/types.md",
        import.meta.url,
      ),

      new URL(
        "./design/compositions/Sessions.md",
        import.meta.url,
      ),

      new URL(
        "./design/compositions/WeShould.md",
        import.meta.url,
      ),

      new URL(
        "./design/compositions/Application.md",
        import.meta.url,
      ),
    ],
  },

  projections: [
    httpWire({
      policy: weShouldPolicy,
      name: "WeShouldWireHttp",
    }),
  ],
};