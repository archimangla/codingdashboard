// Vercel serverless entry point.
//
// This does NOT call app.listen() -- Vercel's Node runtime takes an
// exported Express app directly and handles the request/response cycle
// itself for each invocation. The normal artifacts/api-server/src/index.ts
// (which does call app.listen and needs a PORT) is only used when running
// the server the traditional way (e.g. locally, or on Replit) and is not
// part of this path.
import app from "../artifacts/api-server/src/app";

export default app;
