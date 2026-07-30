// Vercel serverless entry point.
//
// This is plain JavaScript, not TypeScript, on purpose: Vercel's Node
// builder runs its own independent TypeScript pre-check on any .ts
// function file, using strict Node16/NodeNext module resolution rules
// that don't match the rest of this repo's tsconfig (which uses
// "moduleResolution": "bundler"). That mismatch broke resolution of
// this project's dependencies (Express, pino-http) during that separate
// check, even though the real build (typecheck + esbuild bundle) already
// passes cleanly on its own.
//
// Importing the already-built app bundle (produced by
// artifacts/api-server/build.mjs, which runs as part of the normal
// `pnpm run build`) sidesteps that separate check entirely -- there is
// no TypeScript left in this file for Vercel to independently type-check.
//
// This does NOT call app.listen() -- Vercel's Node runtime takes an
// exported Express app directly and handles the request/response cycle
// itself for each invocation.
import app from "../artifacts/api-server/dist/app.mjs";

export default app;
