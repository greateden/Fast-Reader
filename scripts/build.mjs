import esbuild from "esbuild";

const production = process.env.NODE_ENV === "production";

const common = {
  bundle: true,
  sourcemap: !production,
  minify: production,
  logLevel: "info"
};

await Promise.all([
  esbuild.build({
    ...common,
    entryPoints: ["src/main/main.ts"],
    outfile: "dist/main/main.js",
    platform: "node",
    format: "cjs",
    external: ["electron"]
  }),
  esbuild.build({
    ...common,
    entryPoints: ["src/main/preload.ts"],
    outfile: "dist/main/preload.js",
    platform: "node",
    format: "cjs",
    external: ["electron"]
  }),
  esbuild.build({
    ...common,
    entryPoints: ["src/renderer/app.ts"],
    outfile: "dist/renderer/app.js",
    platform: "browser",
    format: "iife"
  })
]);
