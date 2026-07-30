import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mounted twice on purpose. Vercel's rewrite that routes /api/* requests
// to this function may or may not preserve the "/api" prefix on the path
// it actually hands to Express (this differs across setups and isn't
// something we can fully verify without a live deployment). Handling
// both means it works correctly either way instead of guessing wrong
// and 404ing on every request.
app.use("/api", router);
app.use("/", router);

// Global error handler. Without this, Express's built-in default handler
// swallows the real error message/stack -- routes only ever show up in
// logs as a generic "failed with status code 500" with no way to tell
// what actually went wrong (missing DB tables vs bad connection string
// vs a code bug, etc). This logs the full error and echoes a safe
// version of it back in the response so it's visible directly in the
// browser Network tab too, not just in Vercel's function logs.
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error in request");
  res.status(500).json({
    error: "Internal server error",
    message: err instanceof Error ? err.message : String(err),
  });
};
app.use(errorHandler);

export default app;
